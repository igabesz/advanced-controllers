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
var assert = require('assert');
var request = require('request');
var web = require('../index');
var test_base_1 = require('./test-base');
var localBaseUrl = test_base_1.baseUrl + 'methods/';
var MethodTestController = (function (_super) {
    __extends(MethodTestController, _super);
    function MethodTestController() {
        _super.apply(this, arguments);
    }
    MethodTestController.prototype.get = function () { return 'get'; };
    MethodTestController.prototype.post = function () { return 'post'; };
    MethodTestController.prototype.put = function () { return 'put'; };
    MethodTestController.prototype.delete = function () { return 'delete'; };
    __decorate([
        web.get(), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MethodTestController.prototype, "get", null);
    __decorate([
        web.post(), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MethodTestController.prototype, "post", null);
    __decorate([
        web.put(), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MethodTestController.prototype, "put", null);
    __decorate([
        web.del('delete'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], MethodTestController.prototype, "delete", null);
    MethodTestController = __decorate([
        web.controller('methods'), 
        __metadata('design:paramtypes', [])
    ], MethodTestController);
    return MethodTestController;
}(web.ControllerBase));
describe('MethodTestController', function () {
    var ctrl;
    var assertAndParse = function (err, res, body) {
        assert(!err);
        assert.equal(res.statusCode, 200);
        return JSON.parse(body);
    };
    before(function () {
        ctrl = new MethodTestController();
        ctrl.register(test_base_1.app, function () { });
    });
    it('should return get', function (done) {
        request.get(localBaseUrl + 'get', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, 'get');
            done();
        });
    });
    it('should return post', function (done) {
        request.post(localBaseUrl + 'post', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, 'post');
            done();
        });
    });
    it('should return put', function (done) {
        request.put(localBaseUrl + 'put', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, 'put');
            done();
        });
    });
    it('should return delete (use @del, not @delete)', function (done) {
        request.del(localBaseUrl + 'delete', function (err, res, body) {
            var data = assertAndParse(err, res, body);
            assert.equal(data, 'delete');
            done();
        });
    });
});
//# sourceMappingURL=test-methods.js.map