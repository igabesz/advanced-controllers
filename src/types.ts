import * as express from 'express';
import {
	Request as Req,
	Response as Res,
} from 'express';
export {
	Request as Req,
	Response as Res,
} from 'express';


export type ParamFrom = 'req' | 'res' | 'query' | 'body' | 'full-body';

export type PropBinding = {
	index: number;
	from: ParamFrom;
	name: string | symbol;
	type: any;
	opt?: boolean;
};

export interface HttpAction {
	method: string;
	url: string;
	params: PropBinding[];
	permission?: string;
	middlewares: ((req: Req, res: Res, next: Function) => void)[];
}

export interface HttpActionProperty {
	(req: Req, res: Res): any;
	action: HttpAction;
}

export class WebError extends Error {
	static requestErrorTransformer = (error: WebError, message: string, statusCode: number) => {
		error.json = { errors: [ {message} ]};
	}
	statusCode: number;
	text: string;
	json: Object | Array<any>;

	constructor(message: string, statusCode: number = 500) {
		super(message);
		this.statusCode = statusCode;
		WebError.requestErrorTransformer(this, message, statusCode);
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

export interface RequestWithUser extends Req {
	user: {
		hasPermission(permission: string): boolean | Promise<boolean>;
	};
}
