import { HttpActionProperty, Req, Res, RequestWithUser, WebError } from './types';


function permissionOnAction(permName: string, target: any, funcName: string) {
	let prop = <HttpActionProperty>target[funcName];
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.permission = permName || '';
}

function permissionOnClass(permName: string, target: any) {
	// NOTE: At this point the actions already exist and are decorated
	for (let key in target.prototype) {
		let prop = target.prototype[key];
		if (typeof prop === 'function' && prop.action && prop.action.url) {
			prop.action.permission = prop.action.permission || permName;
		}
	}
}

export function permission(name?: string) {
	return (target, funcName?) => {
		// Applied on an action or a class?
		if (funcName) permissionOnAction(name, target, funcName);
		else permissionOnClass(name, target);
	};
}

export function getPermName(target: any, actionFunc: HttpActionProperty) {
	if (actionFunc.action.permission === undefined) return undefined;
	let permName = actionFunc.action.permission;
	if (permName === '') {
		let ctrlName = target.constructor.__controller.name;
		let actionName = actionFunc.action.url;
		permName = `${ctrlName}:${actionName}`.replace(/\//g, '');
	}
	return permName;
}

export interface PermCheckResult {
	success: boolean;
	reason?: 'Unauthenticated' | 'Unauthorized';
}

export function permCheckGenerator(target: any, actionFunc: HttpActionProperty):
	(req: RequestWithUser) => Promise<PermCheckResult>
{
	let permName = getPermName(target, actionFunc);
	if (permName === undefined) {
		return (req: RequestWithUser) => Promise.resolve({ success: true });
	}
	return async(req: RequestWithUser) => {
		if (!req.user || !req.user.hasPermission) {
			return { success: false, reason: 'Unauthenticated' };
		}
		let hasPermission = req.user.hasPermission(permName);
		if (hasPermission instanceof Promise) {
			hasPermission = await hasPermission;
		}
		return {
			success: hasPermission,
			reason: hasPermission ? undefined : 'Unauthorized',
		};
	};
}
