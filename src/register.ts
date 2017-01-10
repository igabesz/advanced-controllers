import * as express from 'express';
import * as _ from 'lodash';
import { Req, Res, HttpActionProperty } from './types';
import { validators } from './validator';
import { resolver } from './params';


function handleError(err: Error | any, res: Res) {
	err.statusCode = err.statusCode || 500;
	if (err.json) {
		return res.status(err.statusCode).json(err.json);
	}
	if (err.text) {
		return res.status(err.statusCode).send(err.text);
	}
	return res.sendStatus(err.statusCode);
}


function registerControllerFunction(thisBind: any, app: express.Express, actionFunc: Function, logger: Function) {
	let action = (actionFunc as HttpActionProperty).action;
	if (!action) { return false; }
	if (!action.method || !action.url) {
		throw new Error('Action has no method: ' + actionFunc);
	}

	let controllerName = thisBind.constructor.__controller.name;
	let url = controllerName + action.url;
	logger && logger('debug', `Registering ${action.method} ${url} [${action.params.map(p => p.name)}]`);

	// Applying middleware
	for (let mwFunc of action.middlewares) {
		logger && logger('debug', `Registering ${action.method} ${url} *MW*`);
		app.use(url, mwFunc.bind(thisBind));
	}

	// Creating parser functions
	let binders: ((params: any[], req: Req, res: Res) => any)[] = [];
	let autoClose = true;
	for (let bind of action.params) {
		let validator = validators.filter((item) => item.type === bind.type)[0];
		if (!validator) throw new Error(`No validator for type: ${bind.type}`);
		binders.push(resolver(bind, validator));
		if (validator.disableAutoClose) autoClose = false;
	}

	// Creating actionProcessor
	let actionProcessor = generateHandler({ binders, argLength: action.params.length, logger, autoClose, thisBind, actionFunc });

	// Applying actionProcessor on app
	app[_.toLower(action.method)](url, actionProcessor);
}

function generateHandler({
	binders,
	argLength,
	logger,
	autoClose,
	thisBind,
	actionFunc,
}: {
	binders: ((params: any[], req: Req, res: Res) => any)[],
	argLength: number,
	logger?: any,
	autoClose: boolean,
	thisBind: any,
	actionFunc: any,
}) {
	return (req: Req, res: Res) => {
		let params = new Array(argLength);
		try {
			// Applying binders
			for (let binder of binders) binder(params, req, res);

			// Calling the action
			let result = actionFunc.apply(thisBind, params);
			if (!autoClose) return;

			// No result -> We're done
			if (result === undefined) return res.sendStatus(200);
			// Promise result -> Wait for it
			else if (result instanceof Promise) {
				result
				.then(response => (result !== undefined) ? res.json(response) : res.sendStatus(200))
				.catch(ex => {
					(!ex.statusCode) && logger && logger('error', 'Something broke (Promise)', { ex, message: ex.message, stack: ex.stack });
					handleError(ex, res);
				});
				return;
			}
			// Anything else -> Send back as json
			res.json(result);
		}
		// Internal error
		catch (ex) {
			(!ex.statusCode) && logger && logger('error', 'Something broke (Exception)', { ex: ex, message: ex.message, stack: ex.stack });
			handleError(ex, res);
		}
	};
}

// https://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class
function getAllFuncs(obj) {
	var props = [];
	let protoObj = obj;
	while (protoObj) {
		props = props.concat(Object.getOwnPropertyNames(protoObj));
		protoObj = Object.getPrototypeOf(protoObj);
	}
	return props.sort().filter(function(e, i, arr) {
		if (e !== arr[i+1] && typeof obj[e] === 'function') return true;
	});
}

export abstract class BaseController {
	register(app: express.Express, logger: (level: 'debug' | 'error', message: string, meta: any) => void = console.log.bind(console)) {
		let ctor = this.constructor as any;
		if (!ctor || !ctor.__controller || !ctor.__controller.name) {
			throw new Error('Must use @controller decoration on controller!');
		}
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let action = ctor.prototype[name];
			if ((action as HttpActionProperty).action) {
				registerControllerFunction(this, app, action, logger);
			}
		}
	}
}
