import { HttpActionProperty, Req, Res, RequestWithUser, WebError } from './types';


export function permission(name?: string) {
	return (target, funcName) => {
		let prop = <HttpActionProperty>target[funcName];
		prop.action = prop.action || {
			url: null,
			method: null,
			params: [],
			middlewares: [],
		};
		prop.action.permission = name || '';
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
