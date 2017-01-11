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
var localBaseUrl = test_base_1.baseUrl + 'perm';
var authenticator = new (function () {
    function class_1() {
        var _this = this;
        this.enabled = false;
        this.permissions = [];
        this.mw = function (req, res, done) {
            if (_this.enabled) {
                req.user = {
                    hasPermission: function (perm) { return _this.permissions.indexOf(perm) !== -1; },
                };
            }
            done();
        };
    }
    return class_1;
}())();
var PermissionController = (function (_super) {
    __extends(PermissionController, _super);
    function PermissionController() {
        return _super.apply(this, arguments) || this;
    }
    PermissionController.prototype.testOneA = function () { return { done: true }; };
    PermissionController.prototype.testOneB = function () { return { done: true }; };
    PermissionController.prototype.testTwo = function () { return { done: true }; };
    PermissionController.prototype.noPerm = function () { return { done: true }; };
    return PermissionController;
}(web.BaseController));
__decorate([
    web.permission(),
    web.get('test1-a'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "testOneA", null);
__decorate([
    web.permission(),
    web.get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "testOneB", null);
__decorate([
    web.permission('perm:test-two'),
    web.post('test2'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "testTwo", null);
__decorate([
    web.get('noperm'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PermissionController.prototype, "noPerm", null);
PermissionController = __decorate([
    web.controller('perm'),
    __metadata("design:paramtypes", [])
], PermissionController);
var ctrl;
var permissionsShouldBe = [
    'perm:test1-a',
    'perm:testOneB',
    'perm:test-two',
];
describe('Permission', function () {
    it('should be created and registered', function () {
        test_base_1.app.use(authenticator.mw);
        ctrl = new PermissionController();
        ctrl.register(test_base_1.app, function () { });
    });
    it('should have good permissions', function () {
        var permissions = ctrl.getAllPermissions();
        assert.equal(permissions.length, permissionsShouldBe.length);
        for (var _i = 0, permissionsShouldBe_1 = permissionsShouldBe; _i < permissionsShouldBe_1.length; _i++) {
            var perm = permissionsShouldBe_1[_i];
            assert.notEqual(permissions.indexOf(perm), -1, "Missing permission: " + perm);
        }
    });
    it('should pass on no-check', function (done) {
        request(localBaseUrl + "/noperm", function (err, res, body) {
            var data = JSON.parse(body);
            assert(!err);
            assert.equal(res.statusCode, 200);
            assert.deepEqual(data, { done: true });
            done();
        });
    });
    it('should fail [401] without authentication (req.user)', function (done) {
        request(localBaseUrl + "/test1-a", function (err, res, body) {
            var data = JSON.parse(body);
            assert(!err);
            assert.equal(res.statusCode, 401);
            assert(data.errors);
            assert(data.errors[0]);
            assert.equal(data.errors[0].message, 'Unauthenticated');
            done();
        });
    });
    it('should pass with authentication and good permissions', function (done) {
        authenticator.enabled = true;
        authenticator.permissions.push('perm:test-two');
        request.post(localBaseUrl + "/test2", {}, function (err, res, body) {
            var data = JSON.parse(body);
            assert(!err);
            assert.equal(res.statusCode, 200);
            assert.deepEqual(data, { done: true });
            done();
        });
    });
    it('should fail [403] with wrong permissions', function (done) {
        request(localBaseUrl + "/testOneB", function (err, res, body) {
            var data = JSON.parse(body);
            assert(!err);
            assert.equal(res.statusCode, 403);
            assert(data.errors);
            assert(data.errors[0]);
            assert.equal(data.errors[0].message, 'Unauthorized');
            done();
        });
    });
});
