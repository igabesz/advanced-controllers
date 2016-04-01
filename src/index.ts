import * as express from 'express';
import * as _ from 'lodash';

//------------------------------------------------------------------------------
// Types

export type Req = express.Request;
export type Res = express.Response;
declare var exports;
declare var Promise;

interface HttpAction {
	method: string;
	url: string;
	params: {
		index: number,
		from: string,
		name: string | symbol,
		type: any
		opt?: boolean
	}[];
	middlewares: ((req: Req, res: Res, next: Function) => void)[];
}

interface HttpActionProperty {
	(req: Req, res: Res): any;
	action: HttpAction;
}

//------------------------------------------------------------------------------
// Declaring routes

export function controller(controllerName: string) {
	if (controllerName[0] !== '/')
		controllerName = '/' + controllerName;

	return (target: any) => {
		target.__controller = { name: controllerName };
	};
}

function getHttpAction(prop: any): HttpAction {
	if (_.isFunction(prop) && prop.action) {
		return prop.action;
	}
	return null;
}

function setHttpAction(prop: HttpActionProperty, method: string, url: string) {
	if (url[0] !== '/')
		url = '/' + url;

	prop.action = prop.action || <any>{};
	prop.action.url = url;
	prop.action.method = method;
	prop.action.params = prop.action.params || [];
	prop.action.middlewares = prop.action.middlewares || [];
}

function routeDeclaration(method: string, name?: string) {
	return (target: any, key?: string, value?: PropertyDescriptor) => {
		setHttpAction(target[key], method, name || key);
	};
}

export function get(name?: string) { return routeDeclaration('GET', name); }
export function post(name?: string) { return routeDeclaration('POST', name); }
export function put(name?: string) { return routeDeclaration('PUT', name); }
export function head(name?: string) { return routeDeclaration('HEAD', name); }
export function options(name?: string) { return routeDeclaration('OPTIONS', name); }
export function del(name?: string) { return routeDeclaration('DELETE', name); }

function addMiddleware(prop: HttpActionProperty, mwFunc: (req: Req, res: Res, next: Function) => void) {
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.middlewares.push(mwFunc);
}

export function middleware(middlewareFunc: ((req: Req, res: Res, next: Function) => void) | string) {
	return (target, funcName) => {
		if (typeof middlewareFunc === 'string') {
			addMiddleware(target[funcName], target[middlewareFunc]);
		}
		else {
			addMiddleware(target[funcName], middlewareFunc);
		}
	};
}

//------------------------------------------------------------------------------
// Parameter parsing

function addParam(prop: HttpActionProperty, name: string | symbol, index: number, from: string, type: string, opt: boolean) {
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.params.push({ index, from, name, type, opt });
}

// Raw request object
export function req() {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, null, parameterIndex, 'req', null, false);
	};
}

// Raw response object
export function res() {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, null, parameterIndex, 'res', null, false);
	};
}

function addParamBinding(name: string, optional: boolean, from: string, type: any) {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, name, parameterIndex, from, type, optional);
	};
}

export function bodyString(name: string, optional?: boolean) { return addParamBinding(name, optional, 'body', String); }
export function bodyNumber(name: string, optional?: boolean) { return addParamBinding(name, optional, 'body', Number); }
export function bodyObject(name: string, optional?: boolean) { return addParamBinding(name, optional, 'body', Object); }
export function bodyArray(name: string, optional?: boolean) { return addParamBinding(name, optional, 'body', Array); }

export function queryString(name: string, optional?: boolean) { return addParamBinding(name, optional, 'query', String); }
export function queryNumber(name: string, optional?: boolean) { return addParamBinding(name, optional, 'query', Number); }
export function queryObject(name: string, optional?: boolean) { return addParamBinding(name, optional, 'query', Object); }
export function queryArray(name: string, optional?: boolean) { return addParamBinding(name, optional, 'query', Array); }

//------------------------------------------------------------------------------
// Registering controller

function close(res: Res, code: number, message?: string) {
	res.status(code).send(message);
}

function registerControllerFunction(thisBind: any, app: express.Express, actionFunc: Function, logger: Function) {
	var action = getHttpAction(actionFunc);
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

	// Creating actionProcessor
	var actionProcessor: (req: Req, res: Res) => any = (req: Req, res: Res) => {
		let params = new Array(action.params.length);
		let autoClose = true; // Send res.end() or res.json() after done
		// Binding properties
		for (let bind of action.params) {
			// Body property
			if (bind.from === 'body' || bind.from === 'query') {
				var input = req[bind.from][bind.name];
				if (input === undefined) {
					if (bind.opt) continue;
					return res.status(400).send(`Missing property: ${bind.name}`);
				}
				if (bind.from === 'query' && bind.type !== String) {
					input = JSON.parse(input);
				}
				// Validating and saving
				if ((bind.type === String) && !_.isString(input)) { return close(res, 400, `Invalid value: ${bind.name} should be a string`); }
				if ((bind.type === Number) && !_.isNumber(input)) { return close(res, 400, `Invalid value: ${bind.name} should be a number`); }
				if ((bind.type === Object) && !_.isObject(input)) { return close(res, 400, `Invalid value: ${bind.name} should be an object`); }
				if ((bind.type === Array) && !_.isArray(input)) { return close(res, 400, `Invalid value: ${bind.name} should be an array`); }
				params[bind.index] = input;
			}
			// Raw request
			else if (bind.from === 'req') {
				params[bind.index] = req;
			}
			// Raw response
			else if (bind.from === 'res') {
				params[bind.index] = res;
				autoClose = false;
			}
		}
		// Calling action
		try {
			let result = actionFunc.apply(thisBind, params);
			if (!autoClose)
				return;

			// No result -> We're done
			if (result === undefined)
				return close(res, 200);
			// Promise result -> Wait for it
			else if (result instanceof Promise) {
				(<any>result)
				.then(response => (result !== undefined) ? res.json(response) : close(res, 200))
				.catch(ex => {
					(!ex.statusCode) && logger && logger('error', 'Something broke (Promise)', { ex: ex, message: ex.message, stack: ex.stack });
					close(res, ex.statusCode || 500);
				});
			}
			// Anything else -> Send back as json
			else {
				res.json(result);
			}
		}
		// Internal error
		catch (ex) {
			(!ex.statusCode) && logger && logger('error', 'Something broke (Exception)', { ex: ex, message: ex.message, stack: ex.stack });
			close(res, ex.statusCode || 500);
		}
	};

	// Applying actionProcessor on app
	app[_.toLower(action.method)](url, actionProcessor);
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

function registerController(controller: BaseController, app: express.Express, logger: Function) {
	let ctor = (<any>controller.constructor);
	if (!ctor || !ctor.__controller || !ctor.__controller.name) {
		throw new Error('Must use @controller decoration on controller!');
	}
	let funcNames = getAllFuncs(controller);
	for (let name of funcNames) {
		let action = ctor.prototype[name];
		if (getHttpAction(action) !== null) {
			registerControllerFunction(controller, app, action, logger);
		}
	}
}

export abstract class BaseController {
	register(app: express.Express, logger: (level: 'debug' | 'error', message: string, meta: any) => void = console.log.bind(console)) {
		registerController(this, app, logger);
	}
}
