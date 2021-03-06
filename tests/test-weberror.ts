import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../dist/index';
import { app, baseUrl } from './test-base';

declare var Promise;
var localBaseUrl = baseUrl + 'error/';


@web.Controller('error')
@web.Public()
class ErrorController extends web.AdvancedController {

	@web.Get('regular')
	regularError(@web.Query('msg') msg: string) {
		throw new Error(msg);
	}

	@web.Get()
	test1() {
		throw new web.WebError('ErrorText1');
	}

	@web.Post()
	test2() {
		throw new web.WebError('ErrorText2', 400);
	}

	@web.Put()
	test3() {
		throw new web.WebError('ErrorText3', { statusCode: 405, errorCode: 1 });
	}

	@web.Get()
	test4() {
		throw new web.WebError('ErrorText4', { statusCode: 405, errorCode: 'error-text' });
	}

}


describe('WebError checks', () => {
	let ctrl: ErrorController;
	let errorMessage: string;
	let errorPayload: any;

	before(() => {
		ctrl = new ErrorController();
		ctrl.register(app, {
			errorLogger: (message, err) => {
				errorMessage = message;
				errorPayload = err;
			},
		});
	});

	it('should handle regular internal errors properly', done => {
		let msg = 'Regular Error';
		errorMessage = '';
		errorPayload = undefined;
		request(localBaseUrl + 'regular?msg=' + msg, (err, response, body) => {
			assert.equal(response.statusCode, 500);
			assert.equal(errorMessage, 'Request failed: ' + msg);
			assert.ok(errorPayload.error instanceof Error);
			assert.equal(errorPayload.request.method, 'GET');
			assert.equal(errorPayload.request.path, '/error/regular');
			done();
		});
	});

	it('should return error text', done => {
		request.get(localBaseUrl + 'test1', (error, response, body) => {
			assert.equal(response.statusCode, 500);
			let data = JSON.parse(body);
			assert.ok(data.errors);
			assert.ok(data.errors[0]);
			assert.equal(data.errors[0].message, 'ErrorText1');
			done();
		});
	});

	it('should return with the specified HTTP error code', done => {
		request.post(localBaseUrl + 'test2', (error, response, body) => {
			assert.equal(response.statusCode, 400);
			let data = JSON.parse(body);
			assert.ok(data.errors);
			assert.ok(data.errors[0]);
			assert.equal(data.errors[0].message, 'ErrorText2');
			done();
		});
	});

	it('should also return an error code', done => {
		request.put(localBaseUrl + 'test3', (error, response, body) => {
			assert.equal(response.statusCode, 405);
			let data = JSON.parse(body);
			assert.ok(data.errors);
			assert.ok(data.errors[0]);
			assert.equal(data.errors[0].message, 'ErrorText3');
			assert.equal(data.errors[0].code, 1);
			done();
		});
	});

	it('should be able to return text errors', done => {
		request.get(localBaseUrl + 'test4', (error, response, body) => {
			assert.equal(response.statusCode, 405);
			let data = JSON.parse(body);
			assert.ok(data.errors);
			assert.ok(data.errors[0]);
			assert.equal(data.errors[0].message, 'ErrorText4');
			assert.equal(data.errors[0].code, 'error-text');
			done();
		});
	});
});
