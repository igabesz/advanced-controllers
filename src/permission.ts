import { HttpActionProperty, Request, Response, RequestWithUser, WebError, getAllFuncs } from './types';


function permissionOnAction(permission: string | boolean, target: any, funcName: string) {
	let prop = <HttpActionProperty>target[funcName];
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.permission = permission;
}

function permissionOnClass(permission: string | boolean, target: any) {
	// NOTE: At this point the actions already exist and are decorated
	let props = getAllFuncs(target.prototype);
	for (let propName of props) {
		let prop = target.prototype[propName];
		if (prop && prop.action && prop.action.url && prop.action.permission === undefined) {
			prop.action.permission = permission;
		}
	}
}

/**
 * Decorator for actions and classes.
 * @param Name of permission. Defaults to the name of the function
 */
export function Permission(name?: string) {
	return (target: any, funcName?: string) => {
		// Applied on a function
		if (funcName) {
			// This will be handled in the Constructor decorator later
			permissionOnAction(name || '', target, funcName);
		}
		// Applied on a class
		else {
			name = name || (target.__controller && target.__controller.name);
			if (!name) throw new Error('Cannot handle Permission decorator: Controller name is unknown');
			permissionOnClass(name, target);
		}
	};
}

/** Decorator for actions and classes. The user must be authenticated to have access */
export function Authorize() {
	return (target: any, funcName?: string) => {
		if (funcName) permissionOnAction(true, target, funcName);
		else permissionOnClass(true, target);
	};
}

/** Decorator for actions and classes. No authentication required */
export function Public() {
	return (target: any, funcName?: string) => {
		if (funcName) permissionOnAction(false, target, funcName);
		else permissionOnClass(false, target);
	};
}


export type PermCheckResult =
	{ success: true } |
	{ success: false, reason: 'Unauthenticated' | 'Unauthorized' };

export module PermCheckResult {
	export function ok(): PermCheckResult { return { success: true }; }
	export function unauthorized(): PermCheckResult { return { success: false, reason: 'Unauthorized' }; }
	export function unauthenticated(): PermCheckResult { return { success: false, reason: 'Unauthenticated' }; }
}


let roleMap: Map<string, string[]> | undefined = undefined;

/** Internal helper */
export function setRoleMap(newRoleMap: Map<string, string[]>) { roleMap = newRoleMap; }

/** Internal helper: Generate permission checker function */
export function permCheckGenerator(target: any, actionFunc: HttpActionProperty): (req: RequestWithUser) => Promise<PermCheckResult> {
	let permName = actionFunc.action.permission;
	// No authentication required
	if (permName === undefined || permName === false) {
		return (req: RequestWithUser) => Promise.resolve(PermCheckResult.ok());
	}
	// Must be authenticated
	if (permName === true) {
		return (req: RequestWithUser) => {
			if (req.user) return Promise.resolve(PermCheckResult.ok());
			return Promise.resolve(PermCheckResult.unauthenticated());
		};
	}
	// Must be authenticated + authorized
	return async(req: RequestWithUser) => {
		// 1st: Check authentication
		if (!req.user) return PermCheckResult.unauthenticated();
		// 2nd: Role based authentication
		if (roleMap) {
			if (!Array.isArray(req.user.roles)) return PermCheckResult.unauthorized();
			for (let role of req.user.roles) {
				let rolePermissions = roleMap.get(role);
				if (!rolePermissions) return PermCheckResult.unauthorized();
				if (rolePermissions.indexOf(<string>permName) !== -1) return PermCheckResult.ok();
			}
			return PermCheckResult.unauthorized();
		}
		// 3rd: Check user.hasPermission
		if (!req.user.hasPermission) {
			return PermCheckResult.unauthorized();
		}
		let hasPermission = req.user.hasPermission(<string>permName);
		if (hasPermission instanceof Promise) {
			hasPermission = await hasPermission;
		}
		return hasPermission ? PermCheckResult.ok() : PermCheckResult.unauthorized();
	};
}
