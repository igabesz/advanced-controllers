import * as express from 'express';
import { Request, Response, HttpActionProperty, RequestWithUser, WebError, getAllFuncs, Validator } from './types';
import { validators } from './validator';
import { resolver } from './params';
import { permCheckGenerator, PermCheckResult, setRoleMap } from './permission';


function handleError(err: Error | any, res: Response) {
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
	debugLogger?: (message: string, meta?: any) => void,
	errorLogger?: (message: string, meta?: any) => void,
	namespace?: string
) {
	let action = actionFunc.action;
	if (!action) { return false; }
	if (!action.method || action.url === undefined) {
		throw new Error('Action has no method: ' + actionFunc);
	}

	let controllerName = thisBind.constructor.__controller.name;
	let path = controllerName + action.url;
	if (namespace) {
		if (namespace[0] !== '/') namespace = '/' + namespace;
		path = namespace + path;
	}
	debugLogger && debugLogger(`Registering ${action.method} ${path} [${action.params.map(p => p.name)}]`);

	// Applying middleware
	for (let mwFunc of action.middlewares) {
		debugLogger && debugLogger(`Registering ${action.method} ${path} <MW> ${mwFunc.name}`);
		mwFunc = mwFunc.bind(thisBind);
		// Middleware must applied for this method only
		app.use(path, (req, res, done) => (req.method === action.method) ? mwFunc(req, res, done) : done());
	}

	// Creating parser functions
	let binders: ((params: any[], req: Request, res: Response) => any)[] = [];
	let autoClose = true;
	for (let bind of action.params) {
		let validator: Validator|undefined = undefined;
		if (bind.type) {
			validator = validators.filter((item) => item.type === bind.type)[0];
			if (!validator) throw new Error(`No validator for type: ${bind.type}`);
		}
		binders.push(resolver(bind, validator));
		if (validator && validator.disableAutoClose) autoClose = false;
	}

	// Creating permission checker
	let permCheck = permCheckGenerator(thisBind, actionFunc);

	// Creating actionProcessor
	let argLength = action.params.length;
	let actionProcessor = generateHandler({ binders, argLength, errorLogger, autoClose, thisBind, actionFunc, permCheck });

	// Applying actionProcessor on app
	let method = <'get'|'post'|'put'|'delete'|'options'|'head'> action.method.toLowerCase();
	app[method](path, actionProcessor as any);
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
	binders: ((params: any[], req: Request, res: Response) => any)[],
	argLength: number,
	errorLogger?: (message: string, meta?: any) => void,
	autoClose: boolean,
	thisBind: any,
	actionFunc: HttpActionProperty,
	permCheck: (req: RequestWithUser) => Promise<PermCheckResult>,
}) {
	return async(req: RequestWithUser, res: Response) => {
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
			let result = (actionFunc as Function).apply(thisBind, params);

			// Awaiting if promise
			if (result instanceof Promise) {
				result = await result;
			}

			// No response sent in autoClosed functions
			// Exception: Rejected autoClosed functions are handled
			if (!autoClose) return;

			// Sending back the results
			if (typeof result === 'string') return res.send(result);
			if (result !== undefined) return res.json(result);
			// No result -> We're done
			res.sendStatus(200);
		}
		// Internal error
		catch (ex) {
			let message = ex.message || '<no message>';
			let request = {
				hostname: req.hostname,
				method: req.method,
				path: req.path,
				origin: req.get('origin'),
				referer: req.get('referer'),
				'user-agent': req.get('user-agent'),
				'x-forwarded-for': req.get('x-forwarded-for'),
			};
			(!ex.statusCode) && errorLogger && errorLogger(`Request failed: ${message}`, { error: ex, request });
			handleError(ex, res);
		}
	};
}

export interface AdvancedControllerSettings {
	/** To specify a route for your controller(s). NOTE that namespaces are not included in whiteLists. */
	namespace?: string;
	/** Log the registration of the controller */
	debugLogger?: (message: string, meta?: any) => void;
	/** Log the errors of the controller during runtime */
	errorLogger?: (message: string, meta?: any) => void;
	/**
	 * Allow actions without explicit access specification?
	 * (One of these: @Permission, @Authorize, @AllowAnonymus on the class or the action)
	 * NOTE that this must be true if there is any access control (the upper decorators) in the application AND you want to use implicit access
	 */
	implicitAccess?: boolean;
}

export abstract class AdvancedController {
	private static controllers: AdvancedController[] = [];
	private static roleMap = new Map<string, string[]>();
	private static anyPermissionsCreated = false;

	/** Registers all AdvancedController instances created so far */
	static registerAll(app: express.Express, settings?: AdvancedControllerSettings) {
		for (let ctrl of AdvancedController.controllers) {
			ctrl.register(app, settings);
		}
	}

	/**
	 * Returns the permissions of all AdvancedController instances created so far.
	 */
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
	 * Returns the public routes of all AdvancedController instances created so far.
	 * NOTE that this does not contain namespaces.
	 */
	static getAllPublicRoutes(): string[] {
		let results: string[] = [];
		for (let ctrl of AdvancedController.controllers) {
			for (let perm of ctrl.getPublicRoutes()) {
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
	 * @param `roles`: Roles containing the permissions
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
		// General validation
		let ctor = this.constructor as any;
		if (!ctor.__controller) {
			throw new Error('AdvancedController must be instantiated with a @Controller decorator');
		}
		let myName = ctor.__controller.name;
		let sameName = AdvancedController.controllers.filter(ctrl => (ctrl.constructor as any).__controller.name === myName);
		if (sameName.length > 0) {
			throw new Error(`There is already a controller with this name (${myName})`);
		}
		AdvancedController.controllers.push(this);
		// Check for permissions + prevent divergent permissions
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let actionFunc = (this as any)[name] as HttpActionProperty;
			if (!actionFunc || !actionFunc.action) continue;

			if (actionFunc.action.permission !== undefined) {
				AdvancedController.anyPermissionsCreated = true;
			}
		}
	}

	/** Registers this controller */
	register(app: express.Express, settings?: AdvancedControllerSettings) {
		let ctor = this.constructor as any;
		if (!ctor || !ctor.__controller || !ctor.__controller.name) {
			throw new Error('Must use @controller decoration on controller!');
		}
		let implicitAccess = settings ? settings.implicitAccess : undefined;
		let funcNames = getAllFuncs(this);
		let actionFuncs: HttpActionProperty[] = [];
		let urlPermissionMap = new Map<string, string | boolean | undefined>();
		for (let name of funcNames) {
			let actionFunc = ctor.prototype[name] as HttpActionProperty;
			if (!actionFunc) continue;
			if (!actionFunc.action) continue;
			// Prevent unintentional implicit accesses
			let permission = actionFunc.action.permission;
			if (permission === undefined && AdvancedController.anyPermissionsCreated && !implicitAccess) {
				throw new Error('Must specify `implicitAccess` in settings!');
			}
			// Prevent divergent permissions
			let url = actionFunc.action.url;
			if (urlPermissionMap.has(url)) {
				let existingPermission = urlPermissionMap.get(url);
				// Error if one is public and the other is not
				if ((!existingPermission && permission) || (existingPermission && !permission)) {
					throw new Error(`Divergent permissions for ${url}: ${existingPermission} !== ${permission}. (Probably at different HTTP methods.)`);
				}
			} else {
				urlPermissionMap.set(url, permission);
			}
			// Cool
			actionFuncs.push(actionFunc);
		}
		// Ok, everything is cool, register all
		let debugLogger = settings ? settings.debugLogger : undefined;
		let errorLogger = settings ? settings.errorLogger : undefined;
		let namespace = settings ? settings.namespace : undefined;
		for (let actionFunc of actionFuncs) {
			registerControllerFunction(this, app, actionFunc, debugLogger, errorLogger, namespace);
		}
	}

	/**
	 * Returns the permissions of this controller.
	 */
	getPermissions(): string[] {
		let result: string[] = [];
		let ctor = this.constructor as any;
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let actionFunc = ctor.prototype[name] as HttpActionProperty;
			if (!actionFunc) continue;
			if (actionFunc.action) {
				let permission = actionFunc.action.permission;
				if (typeof permission === 'string')
					result.push(permission);
			}
		}
		return result;
	}

	/**
	 * Returns the public routes of this controller.
	 * NOTE that this does not contain namespaces.
	 */
	getPublicRoutes(): string[] {
		let result: string[] = [];
		let ctor = this.constructor as any;
		let funcNames = getAllFuncs(this);
		for (let name of funcNames) {
			let actionFunc = ctor.prototype[name] as HttpActionProperty;
			if (!actionFunc) continue;
			if (actionFunc.action) {
				let permission = actionFunc.action.permission;
				if (permission === false || permission === undefined) {
					result.push(ctor.__controller.name + actionFunc.action.url);
				}
			}
		}
		return result;
	}
}
