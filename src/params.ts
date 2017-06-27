import { HttpActionProperty, ParamFrom, PropBinding, Validator, WebError } from './types';
import { Request, Response } from 'express';
export { Request, Response } from 'express';


function addParam(prop: HttpActionProperty, name: string | symbol | undefined, index: number, from: ParamFrom, type: string, opt: boolean) {
	prop.action = prop.action || {
		url: undefined,
		method: undefined,
		params: [],
		middlewares: [],
	};
	prop.action.params.push({ index, from, name, type, opt });
}

/** Bind raw request object */
export function Req() {
	return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, undefined, parameterIndex, 'req', 'req', false);
	};
}

/** Bind raw response object */
export function Res() {
	return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, undefined, parameterIndex, 'res', 'res', false);
	};
}

function addParamBinding(name: string | undefined, optional: boolean | undefined, from: ParamFrom, type: any) {
	return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, name, parameterIndex, from, type, optional || false);
	};
}

/** Bind the whole request.body object */
export function Body(type?: any): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
/** Bind a member of the request.body object */
export function Body(name: string, type: any, optional?: boolean):
	(target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
/** Implementation */
export function Body(nameOrType?: string | any, type?: any, optional?: boolean) {
	if (typeof nameOrType === 'string') {
		return addParamBinding(nameOrType, optional, 'body', type);
	}
	return addParamBinding(undefined, false, 'full-body', nameOrType || Object);
}

/** Bind an element from query */
export function Query(name: string, type: any, optional?: boolean) { return addParamBinding(name, optional, 'query', type); }


/** Bind an element from param (route) */
export function Param(name: string, type: any) { return addParamBinding(name, false, 'param', type); }


/** Internal helper */
export function resolver(bind: PropBinding, validator: Validator): (params: any[], req: Request, res: Response) => any {
	switch (bind.from) {
		case 'req': return (params: any[], req: Request, res: Response) => { params[bind.index] = req; };
		case 'res': return (params: any[], req: Request, res: Response) => { params[bind.index] = res; };

		// Query or Param: we DON'T have body-parser here, we have to parse manually
		case 'param':
		case 'query':
			return (params: any[], req: Request, res: Response) => {
				let name = <string>bind.name;
				let value: string = bind.from === 'query' ? req.query[name] : req.params[name];
				if (value === undefined) {
					if (!bind.opt) throw new WebError(`Missing ${bind.from} property: ${bind.name}`, 400);
					params[bind.index] = undefined;
					return;
				}
				let parsed = validator.parse(value);
				if (!validator.check(parsed)) throw new Error(`Invalid ${bind.from} value: ${bind.name} should be a ${bind.type}`);
				params[bind.index] = parsed;
			};

		// Body: we MUST have body-parser here
		case 'body': return (params: any[], req: Request, res: Response) => {
			// It MUST be parsed
			let parsed = req.body[<string|symbol>bind.name];
			if (parsed === undefined) {
				if (!bind.opt) throw new WebError(`Missing property: ${bind.name}`, 400);
				params[bind.index] = undefined;
				return;
			}
			if (!validator.check(parsed)) throw new Error(`Invalid value: ${bind.name} should be a ${bind.type}`);
			params[bind.index] = parsed;
		};

		// Full-body: we MUST have body-parser here
		case 'full-body': return (params: any[], req: Request, res: Response) => {
			// Cannot be optional
			if (req.body === undefined) {
				throw new WebError(`Empty Body`, 400);
			}
			if (!validator.check(req.body)) throw new Error(`Invalid value: Body should be a ${bind.type}`);
			params[bind.index] = req.body;
		};
	}
}
