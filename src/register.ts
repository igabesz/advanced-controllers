import * as express from 'express';
import * as _ from 'lodash';
import { Req, Res, HttpActionProperty, RequestWithUser, WebError, getAllFuncs } from './types';
import { validators } from './validator';
import { resolver } from './params';
import { getPermName, permCheckGenerator, PermCheckResult, setRoleMap } from './permission';


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
	debugLogger?: Function,
	errorLogger?: Function,
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
	debugLogger && debugLogger(`Registering ${action.method} ${url} [${action.params.map(p => p.name)}]`);

	// Applying middleware
	for (let mwFunc of action.middlewares) {
		debugLogger && debugLogger(`Registering ${action.method} ${url} *MW*`);
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
	let actionProcessor = generateHandler({ binders, argLength, errorLogger, autoClose, thisBind, actionFunc, permCheck });

	// Applying actionProcessor on app
	let method = <'get'|'post'|'put'|'delete'|'options'|'head'>_.toLower(action.method);
	app[method](url, actionProcessor);
}

function generateHandler({
	binders,
	argLength,
	errorLogger,
	autoClose,
	thisBind,
	actionFunc,
	permCheck,
}: {
	binders: ((params: any[], req: Req, res: Res) => any)[],
	argLength: number,
	errorLogger?: Function,
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
			(!ex.statusCode) && errorLogger && errorLogger('error', 'Something broke', { ex: ex, message: ex.message, stack: ex.stack });
			handleError(ex, res);
		}
	};
}

export interface AdvancedControllerSettings {
	/** To specify a route for your controller(s) */
	namespace?: string;
	/** Log the registration of the controller */
	debugLogger?: (message: string, meta?: any) => void;
	/** Log the errors of the controller during runtime */
	errorLogger?: (message: string, meta?: any) => void;
}

export abstract class AdvancedController {
	private static controllers: AdvancedController[] = [];
	private static roleMap = new Map<string, string[]>();

	/** Registers all AdvancedController instances created so far */
	static registerAll(app: express.Express, settings?: AdvancedControllerSettings) {
		for (let ctrl of AdvancedController.controllers) {
			ctrl.register(app, settings);
		}
	}

	/** Returns the permissions of all AdvancedController instances created so far */
	static getAllPermissions(): string[] {
		let results: string[] = [];
		for (let ctrl of AdvancedController.controllers) {
			for (let perm of ctrl.getPermissions()) {
				if (results.indexOf(perm) === -1) {
					results.push(perm);
				}
			}
		}
		return results;
	}

	/**
	 * Set roles for permission check.
	 * Note that this will force role-based authorization, e.g. 'req.user.roles' must be a string array.
	 * @param `roles`: Role objects containing the name of the role and the permissions.
	 */
	static setRoles(roles: { name: string, permissions: string[] }[]) {
		AdvancedController.roleMap.clear();
		for (let role of roles) {
			AdvancedController.roleMap.set(role.name, role.permissions);
		}
		// Update roleMap for permission check
		setRoleMap(AdvancedController.roleMap);
	}

	constructor() {
		AdvancedController.controllers.push(this);
	}

	/** Registers this controller */
	register(app: express.Express, settings?: AdvancedControllerSettings) {
		let ctor = this.constructor as any;
		if (!ctor || !ctor.__controller || !ctor.__controller.name) {
			throw new Error('Must use @controller decoration on controller!');
		}
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let actionFunc = ctor.prototype[name] as HttpActionProperty;
			if (!actionFunc) continue;
			if (actionFunc.action) {
				let debugLogger = settings ? settings.debugLogger : undefined;
				let errorLogger = settings ? settings.errorLogger : undefined;
				let namespace = settings ? settings.namespace : undefined;
				registerControllerFunction(this, app, actionFunc, debugLogger, errorLogger, namespace);
			}
		}
	}

	/** Returns the permissions of this controller */
	getPermissions(): string[] {
		let result: string[] = [];
		let ctor = this.constructor as any;
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let actionFunc = ctor.prototype[name] as HttpActionProperty;
			if (!actionFunc) continue;
			if (actionFunc.action) {
				let permName = getPermName(this, actionFunc);
				if (permName !== undefined)
					result.push(permName);
			}
		}
		return result;
	}
}
