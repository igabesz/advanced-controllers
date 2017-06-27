import { HttpActionProperty, Request, Response } from './types';


function addMiddleware(prop: HttpActionProperty, mwFunc: (req: Request, res: Response, next: Function) => void) {
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.middlewares.push(mwFunc);
}

export function Middleware(middlewareFuncName: string): (target: any, funcName: string) => void;
export function Middleware(middlewareFunc: ((req: Request, res: Response, next: Function) => void)):
	(target: any, funcName: string) => void;
export function Middleware(middlewareFunc: ((req: Request, res: Response, next: Function) => void) | string) {
	return (target: any, funcName: string) => {
		if (typeof middlewareFunc === 'string') {
			addMiddleware(target[funcName], target[middlewareFunc]);
		}
		else {
			addMiddleware(target[funcName], middlewareFunc);
		}
	};
}
