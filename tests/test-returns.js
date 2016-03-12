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
var request = require('request');
var web = require('../index');
var test_base_1 = require('./test-base');
var localBaseUrl = test_base_1.baseUrl + 'returns/';
var ReturnsTestController = (function (_super) {
    __extends(ReturnsTestController, _super);
    function ReturnsTestController() {
        _super.apply(this, arguments);
    }
    ReturnsTestController.prototype.getPromise = function (value) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve({ value: value });
            }, 20);
        });
    };
    ReturnsTestController.prototype.getPromiseRejected = function (code) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                reject({ statusCode: code });
            }, 20);
        });
    };
    __decorate([
        web.get('get-promise'),
        __param(0, web.queryNumber('value')), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [Number]), 
        __metadata('design:returntype', void 0)
    ], ReturnsTestController.prototype, "getPromise", null);
    __decorate([
        web.get('get-promise-rejected'),
        __param(0, web.queryNumber('code')), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [Number]), 
        __metadata('design:returntype', void 0)
    ], ReturnsTestController.prototype, "getPromiseRejected", null);
    ReturnsTestController = __decorate([
        web.controller('returns'), 
        __metadata('design:paramtypes', [])
    ], ReturnsTestController);
    return ReturnsTestController;
}(web.ControllerBase));
describe('ReturnsTestController', function () {
    var mainController;
    var generalAssert = function (err, res) {
        assert(!err);
        assert.equal(res.statusCode, 200);
    };
    before(function () {
        mainController = new ReturnsTestController();
        mainController.register(test_base_1.app, function () { });
    });
    it('should return the promise value', function (done) {
        request(localBaseUrl + 'get-promise?value=99', function (error, response, body) {
            generalAssert(error, response);
            var data = JSON.parse(body);
            assert.equal(data.value, 99);
            done();
        });
    });
    it('should return rejected promise with error code', function (done) {
        request(localBaseUrl + 'get-promise-rejected?code=999', function (error, response, body) {
            assert.equal(response.statusCode, 999);
            done();
        });
    });
});
//# sourceMappingURL=test-returns.js.map