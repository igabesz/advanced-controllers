import { HttpActionProperty, ParamFrom, PropBinding, Validator, WebError } from './types';
import { Request as Req, Response as Res } from 'express';
export { Request as Req, Response as Res } from 'express';


function addParam(prop: HttpActionProperty, name: string | symbol, index: number, from: ParamFrom, type: string, opt: boolean) {
	prop.action = prop.action || {
		url: null,
		method: null,
		params: [],
		middlewares: [],
	};
	prop.action.params.push({ index, from, name, type, opt });
}

/** Bind raw request object */
export function req() {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, null, parameterIndex, 'req', 'req', false);
	};
}

/** Bind raw response object */
export function res() {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, null, parameterIndex, 'res', 'res', false);
	};
}

function addParamBinding(name: string, optional: boolean, from: ParamFrom, type: any) {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
		let prop = <HttpActionProperty>target[propertyKey];
		addParam(prop, name, parameterIndex, from, type, optional);
	};
}

/** Bind the whole request.body object */
export function body(type?: any): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
/** Bind a member of the request.body object */
export function body(name: string, type: any, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
/** Implementation */
export function body(nameOrType?: string | any, type?: any, optional?: boolean) {
	if (typeof nameOrType === 'string') {
		return addParamBinding(nameOrType, optional, 'body', type);
	}
	return addParamBinding(null, false, 'full-body', nameOrType || Object);
}

/** Bind an element from query */
export function query(name: string, type: any, optional?: boolean) { return addParamBinding(name, optional, 'query', type); }


export function resolver(bind: PropBinding, validator: Validator): (params: any[], req: Req, res: Res) => any {
	switch (bind.from) {
		case 'req': return (params: any[], req: Req, res: Res) => { params[bind.index] = req; };
		case 'res': return (params: any[], req: Req, res: Res) => { params[bind.index] = res; };

		// Query: we DON'T have body-parser here
		case 'query':
			return (params: any[], req: Req, res: Res) => {
				let value = req.query[bind.name];
				if (value === undefined) {
					if (!bind.opt) throw new WebError(`Missing property: ${bind.name}`, 400);
					params[bind.index] = undefined;
					return;
				}
				let parsed = validator.parse(value);
				if (!validator.check(parsed)) throw new Error(`Invalid value: ${bind.name} should be a ${bind.type}`);
				params[bind.index] = parsed;
			};

		// Body: we MUST have body-parser here
		case 'body': return (params: any[], req: Req, res: Res) => {
			// It MUST be parsed
			let parsed = req.body[bind.name];
			if (parsed === undefined) {
				if (!bind.opt) throw new WebError(`Missing property: ${bind.name}`, 400);
				params[bind.index] = undefined;
				return;
			}
			if (!validator.check(parsed)) throw new Error(`Invalid value: ${bind.name} should be a ${bind.type}`);
			params[bind.index] = parsed;
		};

		// Full-body: we MUST have body-parser here
		case 'full-body': return (params: any[], req: Req, res: Res) => {
			// Cannot be optional
			if (req.body === undefined) {
				throw new WebError(`Empty Body`, 400);
			}
			if (!validator.check(req.body)) throw new Error(`Invalid value: Body should be a ${bind.type}`);
			params[bind.index] = req.body;
		};
	}
}
