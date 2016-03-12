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
var _ = require('lodash');
var assert = require('assert');
var request = require('request');
var web = require('../index');
var test_base_1 = require('./test-base');
var localBaseUrl = test_base_1.baseUrl + 'binding/';
var BindingTestController = (function (_super) {
    __extends(BindingTestController, _super);
    function BindingTestController() {
        _super.call(this);
        this.items = [];
        this.message = null;
    }
    BindingTestController.prototype.getItems = function () {
        return this.items;
    };
    BindingTestController.prototype.createItem = function (message, value) {
        this.message = message;
        this.items.push(value);
        return { last: _.last(this.items) };
    };
    BindingTestController.prototype.createItemFromObject = function (obj) {
        this.message = obj.message;
        this.items.push(obj.value);
        return { last: _.last(this.items) };
    };
    BindingTestController.prototype.createItemFromQuery = function (items) {
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var val = items_1[_i];
            this.items.push(val);
        }
        return { last: _.last(this.items) };
    };
    BindingTestController.prototype.createItemFromQuery2 = function (value, message) {
        this.message = message;
        this.items.push(value);
        return { last: _.last(this.items) };
    };
    __decorate([
        web.get('/items'), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', []), 
        __metadata('design:returntype', void 0)
    ], BindingTestController.prototype, "getItems", null);
    __decorate([
        web.post('items-body'),
        __param(0, web.bodyString('message', true)),
        __param(1, web.bodyNumber('value')), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [String, Number]), 
        __metadata('design:returntype', void 0)
    ], BindingTestController.prototype, "createItem", null);
    __decorate([
        web.post('wrapped-body'),
        __param(0, web.bodyObject('obj')), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [Object]), 
        __metadata('design:returntype', void 0)
    ], BindingTestController.prototype, "createItemFromObject", null);
    __decorate([
        web.get('items-query'),
        __param(0, web.queryArray('items')), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [Array]), 
        __metadata('design:returntype', void 0)
    ], BindingTestController.prototype, "createItemFromQuery", null);
    __decorate([
        web.get('items-query2'),
        __param(0, web.queryNumber('value')),
        __param(1, web.queryString('message', true)), 
        __metadata('design:type', Function), 
        __metadata('design:paramtypes', [Number, String]), 
        __metadata('design:returntype', void 0)
    ], BindingTestController.prototype, "createItemFromQuery2", null);
    BindingTestController = __decorate([
        web.controller('binding'), 
        __metadata('design:paramtypes', [])
    ], BindingTestController);
    return BindingTestController;
}(web.ControllerBase));
describe('BindingTestController', function () {
    var mainController;
    var generalAssert = function (err, res) {
        assert(!err);
        assert.equal(res.statusCode, 200);
    };
    before(function () {
        mainController = new BindingTestController();
        mainController.register(test_base_1.app, function () { });
    });
    it('should return the empty array', function (done) {
        request(localBaseUrl + 'items', function (err, res, body) {
            generalAssert(err, res);
            assert.deepEqual(JSON.parse(body), []);
            done();
        });
    });
    it('should die on missing required field', function (done) {
        request.post({
            url: localBaseUrl + 'items-body',
            json: { message: 'optional-msg-but-no-value' }
        }, function (err, res, body) {
            assert.strictEqual(res.statusCode, 400);
            done();
        });
    });
    it('should add a number and not die on optional field', function (done) {
        request.post({
            url: localBaseUrl + 'items-body',
            json: { value: 11 }
        }, function (err, res, body) {
            generalAssert(err, res);
            assert.strictEqual(body.last, 11);
            done();
        });
    });
    it('should parse optional field', function (done) {
        var message = 'optional-msg';
        request.post({
            url: localBaseUrl + 'items-body',
            json: { value: 12, message: message }
        }, function (err, res, body) {
            generalAssert(err, res);
            assert.deepEqual(body.last, 12);
            assert.strictEqual(mainController.message, message);
            done();
        });
    });
    it('should parse wrapped object', function (done) {
        var message = 'message-stuff here';
        request.post({
            url: localBaseUrl + 'wrapped-body',
            json: { obj: { value: 14, message: message } }
        }, function (err, res, body) {
            generalAssert(err, res);
            assert.deepEqual(body.last, 14);
            assert.strictEqual(mainController.message, message);
            done();
        });
    });
    it('should parse an array from query', function (done) {
        var length = mainController.items.length;
        request(localBaseUrl + 'items-query?items=' + JSON.stringify([21, 22]), function (err, res, body) {
            generalAssert(err, res);
            var data = JSON.parse(body);
            assert.strictEqual(data.last, 22);
            assert.strictEqual(mainController.items.length, length + 2);
            done();
        });
    });
    it('should parse a number and a string from query', function (done) {
        var message = 'Árvíztűrő ?&= tükörfúrógép';
        request(localBaseUrl + 'items-query2?value=33&message=' + encodeURIComponent(message), function (err, res, body) {
            generalAssert(err, res);
            var data = JSON.parse(body);
            assert.strictEqual(data.last, 33);
            assert.strictEqual(mainController.message, message);
            done();
        });
    });
});
//# sourceMappingURL=test-bindings.js.map