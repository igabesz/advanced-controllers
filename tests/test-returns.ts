import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../lib/index';
import { app, baseUrl } from './test-base';


declare var Promise;
var localBaseUrl = baseUrl + 'returns/';


@web.controller('returns')
class ReturnsTestController extends web.BaseController {
	@web.get('get-promise')
	getPromise(
		@web.query('value', Number) value: number
	) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve({ value: value });
			}, 20);
		});
	}

	@web.get('get-promise-rejected')
	getPromiseRejected(
		@web.query('code', Number) code: number
	) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				reject({ statusCode: code});
			}, 20);
		});
	}

}


describe('ReturnsTestController', () => {
	let mainController: ReturnsTestController;
	let generalAssert = (err, res) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
	};

	before(() => {
		mainController = new ReturnsTestController();
		mainController.register(app, () => {});
	});

	it('should return the promise value', (done) => {
		request(localBaseUrl + 'get-promise?value=99', (error, response, body) => {
			generalAssert(error, response);
			let data = JSON.parse(body);
			assert.equal(data.value, 99);
			done();
		});
	});

	it('should return rejected promise with error code', (done) => {
		request(localBaseUrl + 'get-promise-rejected?code=999', (error, response, body) => {
			assert.equal(response.statusCode, 999);
			done();
		});
	});

});
