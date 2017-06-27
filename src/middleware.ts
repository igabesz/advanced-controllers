import { HttpActionProperty, Req, Res } from './types';


function addMiddleware(prop: HttpActionProperty, mwFunc: (req: Req, res: Res, next: Function) => void) {
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.middlewares.push(mwFunc);
}

export function middleware(middlewareFuncName: string): (target: any, funcName: string) => void;
export function middleware(middlewareFunc: ((req: Req, res: Res, next: Function) => void)): (target: any, funcName: string) => void;
export function middleware(middlewareFunc: ((req: Req, res: Res, next: Function) => void) | string) {
	return (target: any, funcName: string) => {
		if (typeof middlewareFunc === 'string') {
			addMiddleware(target[funcName], target[middlewareFunc]);
		}
		else {
			addMiddleware(target[funcName], middlewareFunc);
		}
	};
}
