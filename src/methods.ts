import { HttpActionProperty } from './types';


export function Controller(controllerName: string) {
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

export function Get(name?: string) { return routeDeclaration('GET', name); }
export function Post(name?: string) { return routeDeclaration('POST', name); }
export function Put(name?: string) { return routeDeclaration('PUT', name); }
export function Head(name?: string) { return routeDeclaration('HEAD', name); }
export function Options(name?: string) { return routeDeclaration('OPTIONS', name); }
export function Del(name?: string) { return routeDeclaration('DELETE', name); }
