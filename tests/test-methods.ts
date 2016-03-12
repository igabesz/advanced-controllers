import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../index';
import { app, baseUrl } from './test-base';


var localBaseUrl = baseUrl + 'methods/';


@web.controller('methods')
class MethodTestController extends web.ControllerBase {
	@web.get()
	get() { return 'get'; }

	@web.post()
	post() { return 'post'; }

	@web.put()
	put() { return 'put'; }

	@web.del('delete')
	delete() { return 'delete'; }
}


describe('MethodTestController', () => {
	let ctrl: any;
	let assertAndParse = (err, res, body) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
		return JSON.parse(body);
	};

	before(() => {
		ctrl = new MethodTestController();
		ctrl.register(app, () => {});
	});

	it('should return get', (done) => {
		request.get(localBaseUrl + 'get', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, 'get');
			done();
		});
	});

	it('should return post', (done) => {
		request.post(localBaseUrl + 'post', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, 'post');
			done();
		});
	});

	it('should return put', (done) => {
		request.put(localBaseUrl + 'put', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, 'put');
			done();
		});
	});

	it('should return delete (use @del, not @delete)', (done) => {
		request.del(localBaseUrl + 'delete', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, 'delete');
			done();
		});
	});

});
