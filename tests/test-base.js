"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
exports.port = 8080;
exports.baseUrl = "http://localhost:" + exports.port + "/";
exports.app = express();
exports.app.use(bodyParser.json());
describe('Startup', function () {
    it('should start already', function (done) {
        exports.app.listen(exports.port, function (err) {
            assert(err === null || err === undefined);
            done();
        });
    });
});
