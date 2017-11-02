import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as assert from 'assert';
import * as request from 'request';

import { Controller, Get, Post, Put, Del, AdvancedController } from '../dist/index';
import { app, baseUrl } from './test-base';


var localBaseUrl = baseUrl + 'methods';


@Controller('methods')
class MethodTestController extends AdvancedController {
	@Get()
	get() { return 'get'; }

	@Get('')
	getEmpty() { return 'get-empty'; }

	@Post()
	post() { return 'post'; }

	@Put()
	put() { return 'put'; }

	@Del('delete')
	delete() { return 'delete'; }
}


describe('MethodTestController', () => {
	let ctrl: any;
	let assertResponse = (err, res, body) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
		return body;
	};

	before(() => {
		ctrl = new MethodTestController();
		ctrl.register(app, { implicitAccess: true });
	});

	it('should return get', (done) => {
		request.get(localBaseUrl + '/get', (err, res, body) => {
			let data = assertResponse(err, res, body);
			assert.equal(data, 'get');
			done();
		});
	});

	it('should handle empty action name', (done) => {
		request.get(localBaseUrl + '', (err, res, body) => {
			let data = assertResponse(err, res, body);
			assert.equal(data, 'get-empty');
			done();
		});
	});

	it('should return post', (done) => {
		request.post(localBaseUrl + '/post', (err, res, body) => {
			let data = assertResponse(err, res, body);
			assert.equal(data, 'post');
			done();
		});
	});

	it('should return put', (done) => {
		request.put(localBaseUrl + '/put', (err, res, body) => {
			let data = assertResponse(err, res, body);
			assert.equal(data, 'put');
			done();
		});
	});

	it('should return delete (use @del, not @delete)', (done) => {
		request.del(localBaseUrl + '/delete', (err, res, body) => {
			let data = assertResponse(err, res, body);
			assert.equal(data, 'delete');
			done();
		});
	});

});
