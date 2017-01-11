import * as express from 'express';
import * as _ from 'lodash';
import { Req, Res, HttpActionProperty, RequestWithUser, WebError } from './types';
import { validators } from './validator';
import { resolver } from './params';
import { getPermName, permCheckGenerator, PermCheckResult } from './permission';


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


function registerControllerFunction(
	thisBind: any,
	app: express.Express,
	actionFunc: HttpActionProperty,
	logger: Function,
	namespace?: string
) {
	let action = actionFunc.action;
	if (!action) { return false; }
	if (!action.method || !action.url) {
		throw new Error('Action has no method: ' + actionFunc);
	}

	let controllerName = thisBind.constructor.__controller.name;
	let url = controllerName + action.url;
	if (namespace) {
		if (namespace[0] !== '/') namespace = '/' + namespace;
		url = namespace + url;
	}
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

	// Creating permission checker
	let permCheck = permCheckGenerator(thisBind, actionFunc);

	// Creating actionProcessor
	let argLength = action.params.length;
	let actionProcessor = generateHandler({ binders, argLength, logger, autoClose, thisBind, actionFunc, permCheck });

	// Applying actionProcessor on app
	let method = _.toLower(action.method);
	app[method](url, actionProcessor);
}

function generateHandler({
	binders,
	argLength,
	logger,
	autoClose,
	thisBind,
	actionFunc,
	permCheck,
}: {
	binders: ((params: any[], req: Req, res: Res) => any)[],
	argLength: number,
	logger?: any,
	autoClose: boolean,
	thisBind: any,
	actionFunc: HttpActionProperty,
	permCheck: (req: RequestWithUser) => Promise<PermCheckResult>,
}) {
	return async(req: RequestWithUser, res: Res) => {
		let params = new Array(argLength);
		try {
			// Permission check
			let permResult = await permCheck(req);
			if (!permResult.success) {
				let statusCode = permResult.reason === 'Unauthenticated' ? 401 : 403;
				throw new WebError(permResult.reason, statusCode);
			}

			// Applying binders
			for (let binder of binders) binder(params, req, res);

			// Calling the action
			let result = actionFunc.apply(thisBind, params);
			if (!autoClose) return;

			// Awaiting if promise
			if (result instanceof Promise) {
				result = await result;
			}
			// Sending back the results
			if (result !== undefined) return res.json(result);
			// No result -> We're done
			res.sendStatus(200);
		}
		// Internal error
		catch (ex) {
			(!ex.statusCode) && logger && logger('error', 'Something broke', { ex: ex, message: ex.message, stack: ex.stack });
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
	register(
		app: express.Express,
		logger: (level: 'debug' | 'error', message: string, meta: any) => void = console.log.bind(console),
		namespace?: string,
	) {
		let ctor = this.constructor as any;
		if (!ctor || !ctor.__controller || !ctor.__controller.name) {
			throw new Error('Must use @controller decoration on controller!');
		}
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let actionFunc = ctor.prototype[name] as HttpActionProperty;
			if (actionFunc.action) {
				registerControllerFunction(this, app, actionFunc, logger, namespace);
			}
		}
	}

	getAllPermissions(): string[] {
		let result: string[] = [];
		let ctor = this.constructor as any;
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let actionFunc = ctor.prototype[name] as HttpActionProperty;
			if (actionFunc.action) {
				let permName = getPermName(this, actionFunc);
				if (permName !== undefined)
					result.push(permName);
			}
		}
		return result;
	}
}
