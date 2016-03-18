"use strict";
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
function bodyString(name, optional) { return addParamBinding(name, optional, 'body', String); }
exports.bodyString = bodyString;
function bodyNumber(name, optional) { return addParamBinding(name, optional, 'body', Number); }
exports.bodyNumber = bodyNumber;
function bodyObject(name, optional) { return addParamBinding(name, optional, 'body', Object); }
exports.bodyObject = bodyObject;
function bodyArray(name, optional) { return addParamBinding(name, optional, 'body', Array); }
exports.bodyArray = bodyArray;
function queryString(name, optional) { return addParamBinding(name, optional, 'query', String); }
exports.queryString = queryString;
function queryNumber(name, optional) { return addParamBinding(name, optional, 'query', Number); }
exports.queryNumber = queryNumber;
function queryObject(name, optional) { return addParamBinding(name, optional, 'query', Object); }
exports.queryObject = queryObject;
function queryArray(name, optional) { return addParamBinding(name, optional, 'query', Array); }
exports.queryArray = queryArray;
function close(res, code, message) {
    res.status(code).send(message);
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
    logger && logger("Registering " + action.method + " " + url + " [" + action.params.map(function (p) { return p.name; }) + "]");
    for (var _i = 0, _a = action.middlewares; _i < _a.length; _i++) {
        var mwFunc = _a[_i];
        logger && logger("Registering " + action.method + " " + url + " *MW*", { thisBind: thisBind, mwFunc: mwFunc });
        app.use(url, mwFunc.bind(thisBind));
    }
    var actionProcessor = function (req, res) {
        var params = new Array(action.params.length);
        var autoClose = true;
        for (var _i = 0, _a = action.params; _i < _a.length; _i++) {
            var bind = _a[_i];
            if (bind.from === 'body' || bind.from === 'query') {
                var input = req[bind.from][bind.name];
                if (input === undefined) {
                    if (bind.opt)
                        continue;
                    return res.status(400).send("Missing property: " + bind.name);
                }
                if (bind.from === 'query' && bind.type !== String) {
                    input = JSON.parse(input);
                }
                if ((bind.type === String) && !_.isString(input)) {
                    return close(res, 400, "Invalid value: " + bind.name + " should be a string");
                }
                if ((bind.type === Number) && !_.isNumber(input)) {
                    return close(res, 400, "Invalid value: " + bind.name + " should be a number");
                }
                if ((bind.type === Object) && !_.isObject(input)) {
                    return close(res, 400, "Invalid value: " + bind.name + " should be an object");
                }
                if ((bind.type === Array) && !_.isArray(input)) {
                    return close(res, 400, "Invalid value: " + bind.name + " should be an array");
                }
                params[bind.index] = input;
            }
            else if (bind.from === 'req') {
                params[bind.index] = req;
            }
            else if (bind.from === 'res') {
                params[bind.index] = res;
                autoClose = false;
            }
        }
        try {
            var result_1 = actionFunc.apply(thisBind, params);
            if (!autoClose)
                return;
            if (result_1 === undefined)
                return close(res, 200);
            else if (result_1 instanceof Promise) {
                result_1
                    .then(function (response) { return (result_1 !== undefined) ? res.json(response) : close(res, 200); })
                    .catch(function (ex) {
                    logger && logger('Something broke (Promise)', { ex: ex, message: ex.message, stack: ex.stack });
                    close(res, ex.statusCode || 500);
                });
            }
            else {
                res.json(result_1);
            }
        }
        catch (ex) {
            logger && logger('Something broke (Exception)', { ex: ex, message: ex.message, stack: ex.stack });
            close(res, ex.statusCode || 500);
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
var ControllerBase = (function () {
    function ControllerBase() {
    }
    ControllerBase.prototype.register = function (app, logger) {
        if (logger === void 0) { logger = console.log.bind(console); }
        registerController(this, app, logger);
    };
    return ControllerBase;
}());
exports.ControllerBase = ControllerBase;
//# sourceMappingURL=index.js.map