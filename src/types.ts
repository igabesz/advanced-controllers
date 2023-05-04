import { Request, Response } from 'express';
export { Request, Response } from 'express';


export type ParamFrom = 'req' | 'res' | 'user' | 'auth' | 'query' | 'param' | 'body' | 'full-body';

export type PropBinding = {
	index: number;
	from: ParamFrom;
	name: string | symbol | undefined;
	type?: any;
	opt?: boolean;
};

export interface HttpAction {
	method: string;
	url: string;
	params: PropBinding[];
	/** Name of the required permission, or `true` if authorization needed, or `false` if public */
	permission?: string | boolean;
	middlewares: ((req: Request, res: Response, next: Function) => void)[];
}

export interface HttpActionProperty {
	(req: Request, res: Response): any;
	action: HttpAction;
}

export class WebError extends Error {
	static requestErrorTransformer = (error: WebError, message: string, statusCode: number, errorCode?: number | string) => {
		error.json = { errors: [ { message, code: errorCode } ]};
	}
	statusCode: number;
	code?: number | string;
	text?: string;
	json?: Object | Array<any>;

	constructor(message: string);
	constructor(message: string, statusCode: number);
	constructor(message: string, settings: {
		/** HTTP status code to return */
		statusCode?: number;
		/** Error code to return within the body */
		errorCode?: number | string;
	});
	constructor(message: string, param2?: number | { statusCode?: number; errorCode?: number | string }) {
		super(message);
		this.statusCode = 500;
		if (typeof param2 === 'number') {
			this.statusCode = param2;
		}
		if (typeof param2 === 'object') {
			param2.statusCode && (this.statusCode = param2.statusCode);
			param2.errorCode && (this.code = param2.errorCode);
		}
		WebError.requestErrorTransformer(this, message, this.statusCode, this.code);
	}
}

export interface Validator {
	/** Type constructor */
	type: any;
	/** Property checker */
	check(value: any): boolean;
	/** Optional: for parsing items from query */
	parse(value: string): any;
	/** Optional: to indicate that this binding disables requrest autoclose */
	disableAutoClose?: boolean;
}

export interface RequestWithUserOrAuth extends Request {
	user: {
		hasPermission?(permission: string): boolean | Promise<boolean>;
		roles?: string[];
	};
	auth: {
		hasPermission?(permission: string): boolean | Promise<boolean>;
		roles?: string[];
	};
}

// https://stackoverflow.com/questions/31054910/get-functions-methods-of-a-class
export function getAllFuncs(obj: any): string[] {
	var props: string[] = [];
	let protoObj = obj;
	while (protoObj) {
		props = props.concat(Object.getOwnPropertyNames(protoObj));
		protoObj = Object.getPrototypeOf(protoObj);
	}
	return props.sort().filter(function(e, i, arr) {
		if (e !== arr[i+1] && typeof obj[e] === 'function') return true;
	});
}
