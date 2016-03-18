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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var assert = require('assert');
var web = require('../lib/index');
var test_base_1 = require('./test-base');
var localBaseUrl = test_base_1.baseUrl + 'returns/';
var MissingDecoratorController = (function (_super) {
    __extends(MissingDecoratorController, _super);
    function MissingDecoratorController() {
        _super.apply(this, arguments);
    }
    MissingDecoratorController.prototype.anything = function () { };
    __decorate([
        web.get(), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MissingDecoratorController.prototype, "anything", null);
    return MissingDecoratorController;
}(web.BaseController));
var SomeController = (function (_super) {
    __extends(SomeController, _super);
    function SomeController() {
        _super.apply(this, arguments);
        this.mwCalled = false;
    }
    SomeController.prototype.nohttpmethod = function () { };
    __decorate([
        web.middleware(function (req, res, next) { this.mwCalled = true; next(); }), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], SomeController.prototype, "nohttpmethod", null);
    SomeController = __decorate([
        web.controller('some'), 
        __metadata('design:paramtypes', [])
    ], SomeController);
    return SomeController;
}(web.BaseController));
var SomeController2 = (function (_super) {
    __extends(SomeController2, _super);
    function SomeController2() {
        _super.apply(this, arguments);
    }
    SomeController2.prototype.nohttpmethod = function (value) { };
    __decorate([
        __param(0, web.queryNumber('value')), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [Number]), 
        __metadata('design:returntype', void 0)
    ], SomeController2.prototype, "nohttpmethod", null);
    SomeController2 = __decorate([
        web.controller('some2'), 
        __metadata('design:paramtypes', [])
    ], SomeController2);
    return SomeController2;
}(web.BaseController));
describe('Various Error Checks', function () {
    it('should not register not-decorated class', function () {
        var ctrl = new MissingDecoratorController();
        assert.throws(function () {
            ctrl.register(test_base_1.app);
        });
    });
    it('should not register an action without a method (but with middleware)', function () {
        var ctrl = new SomeController();
        assert.throws(function () {
            ctrl.register(test_base_1.app);
        });
    });
    it('should not register an action without a method (but with params)', function () {
        var ctrl = new SomeController2();
        assert.throws(function () {
            ctrl.register(test_base_1.app);
        });
    });
});
