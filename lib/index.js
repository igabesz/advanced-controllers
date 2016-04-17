"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require('lodash');
function controller(controllerName) {
    if (controllerName[0] !== '/')
        controllerName = '/' + controllerName;
    return function (target) {
        target.__controller = { name: controllerName };
    };
}
exports.controller = controller;
function getHttpAction(prop) {
    if (_.isFunction(prop) && prop.action) {
        return prop.action;
    }
    return null;
}
function setHttpAction(prop, method, url) {
    if (url[0] !== '/')
        url = '/' + url;
    prop.action = prop.action || {};
    prop.action.url = url;
    prop.action.method = method;
    prop.action.params = prop.action.params || [];
    prop.action.middlewares = prop.action.middlewares || [];
}
function routeDeclaration(method, name) {
    return function (target, key, value) {
        setHttpAction(target[key], method, name || key);
    };
}
function get(name) { return routeDeclaration('GET', name); }
exports.get = get;
function post(name) { return routeDeclaration('POST', name); }
exports.post = post;
function put(name) { return routeDeclaration('PUT', name); }
exports.put = put;
function head(name) { return routeDeclaration('HEAD', name); }
exports.head = head;
function options(name) { return routeDeclaration('OPTIONS', name); }
exports.options = options;
function del(name) { return routeDeclaration('DELETE', name); }
exports.del = del;
function addMiddleware(prop, mwFunc) {
    prop.action = prop.action || {
        url: null,
        method: null,
        params: [],
        middlewares: [],
    };
    prop.action.middlewares.push(mwFunc);
}
function middleware(middlewareFunc) {
    return function (target, funcName) {
        if (typeof middlewareFunc === 'string') {
            addMiddleware(target[funcName], target[middlewareFunc]);
        }
        else {
            addMiddleware(target[funcName], middlewareFunc);
        }
    };
}
exports.middleware = middleware;
function addParam(prop, name, index, from, type, opt) {
    prop.action = prop.action || {
        url: null,
        method: null,
        params: [],
        middlewares: [],
    };
    prop.action.params.push({ index: index, from: from, name: name, type: type, opt: opt });
}
function req() {
    return function (target, propertyKey, parameterIndex) {
        var prop = target[propertyKey];
        addParam(prop, null, parameterIndex, 'req', null, false);
    };
}
exports.req = req;
function res() {
    return function (target, propertyKey, parameterIndex) {
        var prop = target[propertyKey];
        addParam(prop, null, parameterIndex, 'res', null, false);
    };
}
exports.res = res;
function addParamBinding(name, optional, from, type) {
    return function (target, propertyKey, parameterIndex) {
        var prop = target[propertyKey];
        addParam(prop, name, parameterIndex, from, type, optional);
    };
}
function obsWarn(oldAnnotation, newAnnotation) {
    console.warn("Obsolete " + oldAnnotation + ", use " + newAnnotation + " instead");
}
function bodyString(name, optional) { obsWarn('bodyString', 'body'); return addParamBinding(name, optional, 'body', String); }
exports.bodyString = bodyString;
function bodyNumber(name, optional) { obsWarn('bodyNumber', 'body'); return addParamBinding(name, optional, 'body', Number); }
exports.bodyNumber = bodyNumber;
function bodyObject(name, optional) { obsWarn('bodyObject', 'body'); return addParamBinding(name, optional, 'body', Object); }
exports.bodyObject = bodyObject;
function bodyArray(name, optional) { obsWarn('bodyArray', 'body'); return addParamBinding(name, optional, 'body', Array); }
exports.bodyArray = bodyArray;
exports.body = function (nameOrType, type, optional) {
    if (typeof nameOrType === 'string') {
        return addParamBinding(nameOrType, optional, 'body', type);
    }
    return addParamBinding(null, false, 'full-body', nameOrType || Object);
};
function queryString(name, optional) { obsWarn('queryString', 'query'); return addParamBinding(name, optional, 'query', String); }
exports.queryString = queryString;
function queryNumber(name, optional) { obsWarn('queryNumber', 'query'); return addParamBinding(name, optional, 'query', Number); }
exports.queryNumber = queryNumber;
function queryObject(name, optional) { obsWarn('queryObject', 'query'); return addParamBinding(name, optional, 'query', Object); }
exports.queryObject = queryObject;
function queryArray(name, optional) { obsWarn('queryArray', 'query'); return addParamBinding(name, optional, 'query', Array); }
exports.queryArray = queryArray;
function query(name, type, optional) { return addParamBinding(name, optional, 'query', type); }
exports.query = query;
var validators = [
    { type: String, check: _.isString, parse: function (input) { return input; } },
    { type: Number, check: _.isNumber, parse: parseInt },
    { type: Object, check: _.isObject, parse: JSON.parse },
    { type: Array, check: _.isArray, parse: JSON.parse },
];
function addValidator(validator) {
    if (_.some(validators, { type: validator.type })) {
        throw new Error("Cannot add validator with type " + validator.type + ": already parsing that!");
    }
    validators.push(validator);
}
exports.addValidator = addValidator;
var WebError = (function (_super) {
    __extends(WebError, _super);
    function WebError(message, statusCode) {
        if (statusCode === void 0) { statusCode = 500; }
        _super.call(this, message);
        this.statusCode = statusCode;
        WebError.requestErrorTransformer(this, message, statusCode);
    }
    WebError.requestErrorTransformer = function (error, message, statusCode) {
        error.json = { errors: [{ message: message }] };
    };
    return WebError;
}(Error));
exports.WebError = WebError;
function handleError(err, res) {
    err.statusCode = err.statusCode || 500;
    if (err.json) {
        return res.status(err.statusCode).json(err.json);
    }
    if (err.text) {
        return res.status(err.statusCode).send(err.text);
    }
    return res.sendStatus(err.statusCode);
}
function registerControllerFunction(thisBind, app, actionFunc, logger) {
    var action = getHttpAction(actionFunc);
    if (!action) {
        return false;
    }
    if (!action.method || !action.url) {
        throw new Error('Action has no method: ' + actionFunc);
    }
    var controllerName = thisBind.constructor.__controller.name;
    var url = controllerName + action.url;
    logger && logger('debug', "Registering " + action.method + " " + url + " [" + action.params.map(function (p) { return p.name; }) + "]");
    for (var _i = 0, _a = action.middlewares; _i < _a.length; _i++) {
        var mwFunc = _a[_i];
        logger && logger('debug', "Registering " + action.method + " " + url + " *MW*");
        app.use(url, mwFunc.bind(thisBind));
    }
    var binders = [];
    var autoClose = true;
    var _loop_1 = function(bind) {
        if (bind.from === 'req') {
            binders.push(function (params, req, res) { params[bind.index] = req; });
            return "continue";
        }
        if (bind.from === 'res') {
            binders.push(function (params, req, res) { params[bind.index] = res; });
            autoClose = false;
            return "continue";
        }
        var validator = validators.filter(function (item) { return item.type === bind.type; })[0];
        if (!validator)
            throw new Error("No validator for type: " + bind.type);
        if (bind.from === 'full-body') {
            binders.push(function (params, req, res) {
                if (req.body === undefined) {
                    throw new WebError("Empty Body", 400);
                }
                if (!validator.check(req.body))
                    throw new Error("Invalid value: Body should be a " + bind.type);
                params[bind.index] = req.body;
            });
            return "continue";
        }
        if (bind.from === 'body') {
            binders.push(function (params, req, res) {
                var parsed = req.body[bind.name];
                if (parsed === undefined) {
                    if (!bind.opt)
                        throw new WebError("Missing property: " + bind.name, 400);
                    params[bind.index] = undefined;
                    return;
                }
                if (!validator.check(parsed))
                    throw new Error("Invalid value: " + bind.name + " should be a " + bind.type);
                params[bind.index] = parsed;
            });
            return "continue";
        }
        if (bind.from === 'query') {
            if (!validator.parse)
                throw new Error("No parser in validator for type: " + bind.type + "; required when binding to query params");
            binders.push(function (params, req, res) {
                var value = req.query[bind.name];
                if (value === undefined) {
                    if (!bind.opt)
                        throw new WebError("Missing property: " + bind.name, 400);
                    params[bind.index] = undefined;
                    return;
                }
                var parsed = validator.parse(value);
                if (!validator.check(parsed))
                    throw new Error("Invalid value: " + bind.name + " should be a " + bind.type);
                params[bind.index] = parsed;
            });
            return "continue";
        }
    };
    for (var _b = 0, _c = action.params; _b < _c.length; _b++) {
        var bind = _c[_b];
        _loop_1(bind);
    }
    var actionProcessor = function (req, res) {
        var params = new Array(action.params.length);
        try {
            for (var _i = 0, binders_1 = binders; _i < binders_1.length; _i++) {
                var binder = binders_1[_i];
                binder(params, req, res);
            }
            var result_1 = actionFunc.apply(thisBind, params);
            if (!autoClose)
                return;
            if (result_1 === undefined)
                return res.sendStatus(200);
            else if (result_1 instanceof Promise) {
                result_1
                    .then(function (response) { return (result_1 !== undefined) ? res.json(response) : res.sendStatus(200); })
                    .catch(function (ex) {
                    (!ex.statusCode) && logger && logger('error', 'Something broke (Promise)', { ex: ex, message: ex.message, stack: ex.stack });
                    handleError(ex, res);
                });
            }
            else {
                res.json(result_1);
            }
        }
        catch (ex) {
            (!ex.statusCode) && logger && logger('error', 'Something broke (Exception)', { ex: ex, message: ex.message, stack: ex.stack });
            handleError(ex, res);
        }
    };
    app[_.toLower(action.method)](url, actionProcessor);
}
function getAllFuncs(obj) {
    var props = [];
    var protoObj = obj;
    while (protoObj) {
        props = props.concat(Object.getOwnPropertyNames(protoObj));
        protoObj = Object.getPrototypeOf(protoObj);
    }
    return props.sort().filter(function (e, i, arr) {
        if (e !== arr[i + 1] && typeof obj[e] === 'function')
            return true;
    });
}
function registerController(controller, app, logger) {
    var ctor = controller.constructor;
    if (!ctor || !ctor.__controller || !ctor.__controller.name) {
        throw new Error('Must use @controller decoration on controller!');
    }
    var funcNames = getAllFuncs(controller);
    for (var _i = 0, funcNames_1 = funcNames; _i < funcNames_1.length; _i++) {
        var name_1 = funcNames_1[_i];
        var action = ctor.prototype[name_1];
        if (getHttpAction(action) !== null) {
            registerControllerFunction(controller, app, action, logger);
        }
    }
}
var BaseController = (function () {
    function BaseController() {
    }
    BaseController.prototype.register = function (app, logger) {
        if (logger === void 0) { logger = console.log.bind(console); }
        registerController(this, app, logger);
    };
    return BaseController;
}());
exports.BaseController = BaseController;
//# sourceMappingURL=index.js.map