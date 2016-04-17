import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../lib/index';
import { app, baseUrl } from './test-base';


var localBaseUrl = baseUrl + 'binding/';


@web.controller('binding')
class BindingTestController extends web.BaseController {
	items = [];
	message: string = null;

	constructor() {
		super();
	}

	@web.get('/items')
	getItems() {
		return this.items;
	}

	@web.post('items-body')
	createItem(
		@web.body('message', String, true) message: string,
		@web.body('value', Number) value: number
	) {
		this.message = message;
		this.items.push(value);
		return { last: _.last(this.items) };
	}

	@web.post('wrapped-body')
	createItemFromObject(
		@web.body('obj', Object) obj: any
	) {
		this.message = obj.message;
		this.items.push(obj.value);
		return { last: _.last(this.items) };
	}

	@web.get('items-query')
	createItemFromQuery(
		@web.query('items', Array) items: number[]
	) {
		for (let val of items)
			this.items.push(val);
		return { last: _.last(this.items) };
	}

	@web.get('items-query2')
	createItemFromQuery2(
		@web.query('value', Number) value: number,
		@web.query('message', String, true) message: string
	) {
		this.message = message;
		this.items.push(value);
		return { last: _.last(this.items) };
	}
}



describe('BindingTestController', () => {
	let mainController: BindingTestController;
	let generalAssert = (err, res) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
	};

	before(() => {
		mainController = new BindingTestController();
		mainController.register(app, () => {});
	});

	it('should return the empty array', (done) => {
		request(localBaseUrl + 'items', (err, res, body) => {
			generalAssert(err, res);
			assert.deepEqual(JSON.parse(body), []);
			done();
		});
	});

	it('should die on missing required field', done => {
		request.post({
			url: localBaseUrl + 'items-body',
			json: { message: 'optional-msg-but-no-value' }
		}, (err, res, body) => {
			assert.strictEqual(res.statusCode, 400);
			done();
		});

	});

	it('should add a number and not die on optional field', done => {
		request.post({
			url: localBaseUrl + 'items-body',
			json: { value: 11 }
		}, (err, res, body) => {
			generalAssert(err, res);
			assert.strictEqual(body.last, 11);
			done();
		});
	});

	it('should parse optional field', done => {
		let message = 'optional-msg';
		request.post({
			url: localBaseUrl + 'items-body',
			json: { value: 12, message: message }
		}, (err, res, body) => {
			generalAssert(err, res);
			assert.deepEqual(body.last, 12);
			assert.strictEqual(mainController.message, message);
			done();
		});
	});

	it('should parse wrapped object', done => {
		let message = 'message-stuff here';
		request.post({
			url: localBaseUrl + 'wrapped-body',
			json: { obj: { value: 14, message: message }}
		}, (err, res, body) => {
			generalAssert(err, res);
			assert.deepEqual(body.last, 14);
			assert.strictEqual(mainController.message, message);
			done();
		});
	});

	it('should parse an array from query', done => {
		let length = mainController.items.length;
		request(localBaseUrl + 'items-query?items=' + JSON.stringify([21, 22]), (err, res, body) => {
			generalAssert(err, res);
			let data = JSON.parse(body);
			assert.strictEqual(data.last, 22);
			assert.strictEqual(mainController.items.length, length + 2);
			done();
		});
	});

	it('should parse a number and a string from query', done => {
		let message = 'Árvíztűrő ?&= tükörfúrógép';
		request(localBaseUrl + 'items-query2?value=33&message=' + encodeURIComponent(message), (err, res, body) => {
			generalAssert(err, res);
			let data = JSON.parse(body);
			assert.strictEqual(data.last, 33);
			assert.strictEqual(mainController.message, message);
			done();
		});
	});
});






/**/
