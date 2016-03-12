"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _this = this;
var assert = require('assert');
var request = require('request');
var web = require('../index');
var test_base_1 = require('./test-base');
var localBaseUrl = test_base_1.baseUrl + 'middleware/';
var MiddlewareTestController = (function (_super) {
    __extends(MiddlewareTestController, _super);
    function MiddlewareTestController() {
        _super.apply(this, arguments);
        this.middlewareCalled = false;
    }
    MiddlewareTestController.prototype.noMiddleware = function () {
        return this.middlewareCalled;
    };
    MiddlewareTestController.prototype.middleware = function (req, res, next) {
        this.middlewareCalled = true;
        next();
    };
    MiddlewareTestController.prototype.implicitMiddleware = function () {
        return this.middlewareCalled;
    };
    MiddlewareTestController.prototype.explicitMiddleware = function () {
        return this.middlewareCalled;
    };
    MiddlewareTestController.prototype.explicitArrayFunctionMiddleware = function () {
        return this.middlewareCalled;
    };
    __decorate([
        web.get('no-middleware'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MiddlewareTestController.prototype, "noMiddleware", null);
    __decorate([
        web.get('implicit-middleware'),
        web.middleware('middleware'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MiddlewareTestController.prototype, "implicitMiddleware", null);
    __decorate([
        web.get('explicit-middleware'),
        web.middleware(function (req, res, next) { this.middlewareCalled = true; next(); }), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MiddlewareTestController.prototype, "explicitMiddleware", null);
    __decorate([
        web.get('explicit-array-function-middleware'),
        web.middleware(function (req, res, next) { _this.middlewareCalled = true; next(); }), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MiddlewareTestController.prototype, "explicitArrayFunctionMiddleware", null);
    MiddlewareTestController = __decorate([
        web.controller('middleware'), 
        __metadata('design:paramtypes', [])
    ], MiddlewareTestController);
    return MiddlewareTestController;
}(web.ControllerBase));
describe('MiddlewareTestController', function () {
    var ctrl;
    var assertAndParse = function (err, res, body) {
        assert(!err);
        assert.equal(res.statusCode, 200);
        return JSON.parse(body);
    };
    before(function () {
        ctrl = new MiddlewareTestController();
        ctrl.register(test_base_1.app, function () { });
    });
    beforeEach(function () {
        ctrl.middlewareCalled = false;
    });
    it('should not call the middleware', function (done) {
        request(localBaseUrl + 'no-middleware', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, false);
            done();
        });
    });
    it('should call the middleware implicitely', function (done) {
        request(localBaseUrl + 'implicit-middleware', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, true);
            done();
        });
    });
    it('should call the middleware explicitely', function (done) {
        request(localBaseUrl + 'explicit-middleware', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, true);
            done();
        });
    });
    it('won\'t work with array functions + ES5 build, sadly...', function (done) {
        request(localBaseUrl + 'explicit-array-function-middleware', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, false);
            done();
        });
    });
});
//# sourceMappingURL=test-mw.js.map