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
var assert = require("assert");
var request = require("request");
var web = require("../lib/index");
var test_base_1 = require("./test-base");
var myNamespace = 'my-namespace';
var localBaseUrl = test_base_1.baseUrl + myNamespace + '/somectrl';
var NamespaceController = (function (_super) {
    __extends(NamespaceController, _super);
    function NamespaceController() {
        return _super.apply(this, arguments) || this;
    }
    NamespaceController.prototype.test = function () { return { done: true }; };
    return NamespaceController;
}(web.BaseController));
__decorate([
    web.get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NamespaceController.prototype, "test", null);
NamespaceController = __decorate([
    web.controller('somectrl'),
    __metadata("design:paramtypes", [])
], NamespaceController);
var ctrl;
describe('Namespace', function () {
    it('should be created and registered', function () {
        ctrl = new NamespaceController();
        ctrl.register(test_base_1.app, function () { }, myNamespace);
    });
    it('should work with namespace', function (done) {
        request(localBaseUrl + "/test", function (err, res, body) {
            var data = JSON.parse(body);
            assert(!err);
            assert.equal(res.statusCode, 200);
            assert.deepEqual(data, { done: true });
            done();
        });
    });
});
