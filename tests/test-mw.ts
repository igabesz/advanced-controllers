import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../lib/index';
import { app, baseUrl } from './test-base';


var localBaseUrl = baseUrl + 'middleware/';


@web.controller('middleware')
class MiddlewareTestController extends web.AdvancedController {
	middlewareCalled = false;

	@web.get('no-middleware')
	noMiddleware() {
		return this.middlewareCalled;
	}

	middleware(req: web.Req, res: web.Res, next: Function) {
		this.middlewareCalled = true;
		next();
	}

	@web.get('implicit-middleware')
	@web.middleware('middleware')
	implicitMiddleware() {
		return this.middlewareCalled;
	}

	@web.get('explicit-middleware')
	@web.middleware(function(req, res, next) { this.middlewareCalled = true; next(); })
	explicitMiddleware() {
		return this.middlewareCalled;
	}

	@web.get('explicit-array-function-middleware')
	@web.middleware((req, res, next) => { this.middlewareCalled = true; next(); })
	explicitArrayFunctionMiddleware() {
		return this.middlewareCalled;
	}
}


describe('MiddlewareTestController', () => {
	let ctrl: any;
	let assertAndParse = (err, res, body) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
		return JSON.parse(body);
	};

	before(() => {
		ctrl = new MiddlewareTestController();
		ctrl.register(app, () => {});
		// ctrl.register(app);
	});

	beforeEach(() => {
		ctrl.middlewareCalled = false;
	});

	it('should not call the middleware', (done) => {
		request(localBaseUrl + 'no-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, false);
			done();
		});
	});

	it('should call the middleware implicitely', (done) => {
		request(localBaseUrl + 'implicit-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, true);
			done();
		});
	});

	it('should call the middleware explicitely', (done) => {
		request(localBaseUrl + 'explicit-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, true);
			done();
		});
	});

	it('won\'t work with array functions + ES5 build, sadly...', (done) => {
		request(localBaseUrl + 'explicit-array-function-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, false);
			done();
		});
	});
});


















//
