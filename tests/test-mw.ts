import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../dist/index';
import { app, baseUrl } from './test-base';


var localBaseUrl = baseUrl + 'middleware/';


@web.Controller('middleware')
@web.Public()
class MiddlewareTestController extends web.AdvancedController {
	middlewareCalled = false;

	@web.Get('no-middleware')
	noMiddleware() {
		return this.middlewareCalled;
	}

	middleware(req: web.Request, res: web.Response, next: Function) {
		this.middlewareCalled = true;
		next();
	}

	@web.Get('implicit-middleware')
	implicitMiddleware() {
		return this.middlewareCalled;
	}

	@web.Post('implicit-middleware')
	@web.Middleware('middleware')
	implicitMiddlewarePost() {
		return this.middlewareCalled;
	}

	@web.Put('implicit-middleware')
	implicitMiddlewarePut() {
		return this.middlewareCalled;
	}

	@web.Get('explicit-middleware')
	@web.Middleware(function(this: MiddlewareTestController, eq, res, next) { this.middlewareCalled = true; next(); })
	explicitMiddleware() {
		return this.middlewareCalled;
	}

	// @web.Get('explicit-array-function-middleware')
	// @web.Middleware((req, res, next) => { (this).middlewareCalled = true; next(); })
	// explicitArrayFunctionMiddleware() {
	// 	return this.middlewareCalled;
	// }
}


describe('MiddlewareTestController', () => {
	let ctrl: MiddlewareTestController;
	let assertAndParse = (err, res, body) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
		return JSON.parse(body);
	};

	beforeEach(() => {
		ctrl && (ctrl.middlewareCalled = false);
	});

	it('should register classes with AllowAnonymus decorator', () => {
		ctrl = new MiddlewareTestController();
		ctrl.register(app);
	});

	it('should not call the middleware', (done) => {
		request(localBaseUrl + 'no-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, false);
			done();
		});
	});

	it('should call the middleware implicitely', (done) => {
		request.post(localBaseUrl + 'implicit-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, true);
			done();
		});
	});

	it('should not call the middleware with different method', (done) => {
		request.get(localBaseUrl + 'implicit-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, false, 'GET method');
			request.put(localBaseUrl + 'implicit-middleware', (err2, res2, body2) => {
				let data2 = assertAndParse(err2, res2, body2);
				assert.equal(data2, false, 'PUT method');
			done();
			});
		});
	});

	it('should call the middleware explicitely', (done) => {
		request(localBaseUrl + 'explicit-middleware', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, true);
			done();
		});
	});

	// it('won\'t work with array functions + ES5 build, sadly...', (done) => {
	// 	request(localBaseUrl + 'explicit-array-function-middleware', (err, res, body) => {
	// 		let data = assertAndParse(err, res, body);
	// 		assert.equal(data, false);
	// 		done();
	// 	});
	// });
});


















//
