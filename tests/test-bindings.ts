import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import { Controller, Get, Post, Req, Res, Request, Response, Body, Query, Param, AdvancedController } from '../dist/index';
import { app, baseUrl } from './test-base';


var localBaseUrl = baseUrl + 'binding/';


@Controller('binding')
class BindingTestController extends AdvancedController {
	items: number[] = [];
	message: string;

	@Get()
	reqres(
		@Req() req: Request,
		@Res() res: Response,
	) {
		res.end();
	}

	@Get('/items')
	getItems() {
		return this.items;
	}

	@Post('items-body')
	createItem(
		@Body('message', String, true) message: string,
		@Body('value', Number) value: number
	) {
		this.message = message;
		this.items.push(value);
		return { last: _.last(this.items) };
	}

	@Post('wrapped-body')
	createItemFromObject(
		@Body('obj', Object) obj: any
	) {
		this.message = obj.message;
		this.items.push(obj.value);
		return { last: _.last(this.items) };
	}

	@Post('whole-body')
	fullBody(@Body() obj: any) {
		this.message = obj.message;
		this.items.push(obj.value);
		return { last: _.last(this.items) };
	}

	@Get('items-query')
	createItemFromQuery(
		@Query('items', Array) items: number[]
	) {
		for (let val of items)
			this.items.push(val);
		return { last: _.last(this.items) };
	}

	@Get('items-query2')
	createItemFromQuery2(
		@Query('value', Number) value: number,
		@Query('message', true) message: string
	) {
		this.message = message;
		this.items.push(value);
		return { last: _.last(this.items) };
	}

	@Get('items-params/:id')
	itemsParams(@Param('id', Number) id: number) {
		return { id };
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
		mainController.register(app, { implicitAccess: true });
	});

	it('should serve req and res', (done) => {
		request(localBaseUrl + 'reqres', (err, res, body) => {
			generalAssert(err, res);
			done();
		});
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

	it('should parse whole body', done => {
		let message = 'whole-body-message';
		let value = 15;
		request.post({
			url: localBaseUrl + 'whole-body',
			json: { value, message }
		}, (err, res, body) => {
			generalAssert(err, res);
			assert.deepEqual(body.last, value);
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

	it('should parse params', done => {
		let id = 43;
		request(localBaseUrl + 'items-params/' + id, (err, res, body) => {
			generalAssert(err, res);
			let data = JSON.parse(body);
			assert.strictEqual(data.id, id);
			done();
		});
	});

	it('should return 404 on missing param (default Express behavior)', done => {
		let id = 43;
		request(localBaseUrl + 'items-params/', (err, res, body) => {
			assert.equal(res.statusCode, 404);
			done();
		});
	});

});
