import { HttpActionProperty, Request, Response, RequestWithUser, WebError, getAllFuncs } from './types';


function permissionOnAction(permName: string | undefined, target: any, funcName: string) {
	let prop = <HttpActionProperty>target[funcName];
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.permission = permName || '';
}

function permissionOnClass(permName: string | undefined, target: any) {
	permName = permName || target.__controller.name;
	if (!permName) throw new Error(`Cannot add empty permission on class`);
	// NOTE: At this point the actions already exist and are decorated
	let props = getAllFuncs(target.prototype);
	for (let propName of props) {
		let prop = target.prototype[propName];
		if (prop && prop.action && prop.action.url) {
			prop.action.permission = prop.action.permission || permName;
		}
	}
}

/**
 * Decorator for actions
 * @param Name of permission. Defaults to the name of the function
 */
export function Permission(name?: string) {
	return (target: any, funcName?: string) => {
		// Applied on an action or a class?
		if (funcName) permissionOnAction(name, target, funcName);
		else permissionOnClass(name, target);
	};
}

/** Internal helper */
export function getPermName(target: any, actionFunc: HttpActionProperty) {
	if (actionFunc.action.permission === undefined) return undefined;
	let permName = actionFunc.action.permission;
	if (permName === '') {
		let ctrlName = target.constructor.__controller.name;
		let actionName = actionFunc.action.url;
		permName = `${ctrlName}.${actionName}`.replace(/\//g, '');
	}
	return permName;
}

export type PermCheckResult = {
	success: true
} | {
	success: false;
	reason: 'Unauthenticated' | 'Unauthorized';
};
export module PermCheckResult {
	export function ok() { return { success: true }; }
	export function unauthorized() { return { success: false, reason: 'Unauthorized' }; }
	export function unauthenticated() { return { success: false, reason: 'Unauthenticated' }; }
}


let roleMap: Map<string, string[]> | undefined = undefined;

/** Internal helper */
export function setRoleMap(newRoleMap: Map<string, string[]>) { roleMap = newRoleMap; }

/** Internal helper: Generate permission checker function */
export function permCheckGenerator(target: any, actionFunc: HttpActionProperty):
	(req: RequestWithUser) => Promise<PermCheckResult>
{
	let permName = getPermName(target, actionFunc);
	if (permName === undefined) {
		return (req: RequestWithUser) => Promise.resolve(PermCheckResult.ok());
	}
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
			return { success: false, reason: 'Unauthorized' };
		}
		// 3rd: Check user.hasPermission
		if (!req.user.hasPermission) {
			return { success: false, reason: 'Unauthorized' };
		}
		let hasPermission = req.user.hasPermission(<string>permName);
		if (hasPermission instanceof Promise) {
			hasPermission = await hasPermission;
		}
		return {
			success: hasPermission,
			reason: hasPermission ? undefined : 'Unauthorized',
		};
	};
}
