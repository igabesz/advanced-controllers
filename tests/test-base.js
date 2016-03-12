"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
exports.app = express();
exports.port = 8080;
exports.baseUrl = "http://localhost:" + exports.port + "/";
exports.app.use(bodyParser.json());
describe('Startup', function () {
    it('should start already', function (done) {
        exports.app.listen(exports.port, function (err) {
            assert(err === null || err === undefined);
            done();
        });
    });
});
//# sourceMappingURL=test-base.js.map