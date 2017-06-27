import { HttpActionProperty } from './types';


export function controller(controllerName: string) {
	if (controllerName[0] !== '/')
		controllerName = '/' + controllerName;

	return (target: any) => {
		target.__controller = { name: controllerName };
	};
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
	return (target: any, key: string, value?: PropertyDescriptor) => {
		setHttpAction(target[key], method, name || key);
	};
}

export function get(name?: string) { return routeDeclaration('GET', name); }
export function post(name?: string) { return routeDeclaration('POST', name); }
export function put(name?: string) { return routeDeclaration('PUT', name); }
export function head(name?: string) { return routeDeclaration('HEAD', name); }
export function options(name?: string) { return routeDeclaration('OPTIONS', name); }
export function del(name?: string) { return routeDeclaration('DELETE', name); }
