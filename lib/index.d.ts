import * as express from 'express';
export declare type Req = express.Request;
export declare type Res = express.Response;
export declare function controller(controllerName: string): (target: any) => void;
export declare function get(name?: string): (target: any, key?: string, value?: PropertyDescriptor) => void;
export declare function post(name?: string): (target: any, key?: string, value?: PropertyDescriptor) => void;
export declare function put(name?: string): (target: any, key?: string, value?: PropertyDescriptor) => void;
export declare function head(name?: string): (target: any, key?: string, value?: PropertyDescriptor) => void;
export declare function options(name?: string): (target: any, key?: string, value?: PropertyDescriptor) => void;
export declare function del(name?: string): (target: any, key?: string, value?: PropertyDescriptor) => void;
export declare function middleware(middlewareFunc: ((req: Req, res: Res, next: Function) => void) | string): (target: any, funcName: any) => void;
export declare function req(): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function res(): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function bodyString(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function bodyNumber(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function bodyObject(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function bodyArray(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare var body: {
    (type: any): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
    (name: string, type: any, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
};
export declare function queryString(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function queryNumber(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function queryObject(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function queryArray(name: string, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export declare function query(name: string, type: any, optional?: boolean): (target: Object, propertyKey: string | symbol, parameterIndex: number) => void;
export interface Validator {
    type: any;
    check(value: any): boolean;
    parse?(value: string): any;
}
export declare function addValidator(validator: Validator): void;
export declare class WebError extends Error {
    static requestErrorTransformer: (error: WebError, message: string, statusCode: number) => void;
    statusCode: number;
    text: string;
    json: Object | Array<any>;
    constructor(message: string, statusCode?: number);
}
export declare abstract class BaseController {
    register(app: express.Express, logger?: (level: 'debug' | 'error', message: string, meta: any) => void): void;
}
