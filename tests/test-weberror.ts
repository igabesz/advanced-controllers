import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../lib/index';
import { app, baseUrl } from './test-base';

declare var Promise;
var localBaseUrl = baseUrl + 'error/';


@web.controller('error')
class ErrorController extends web.BaseController {

	@web.get()
	test1() {
		throw new web.WebError('ErrorText1');
	}

	@web.post()
	test2() {
		throw new web.WebError('ErrorText2', 400);
	}

	@web.put()
	test3() {
		throw new web.WebError('ErrorText3', { statusCode: 405, errorCode: 1 });
	}

}


describe('WebError checks', () => {
	const ctrl = new ErrorController();

	before(() => {
		ctrl.register(app, () => {});
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
});
