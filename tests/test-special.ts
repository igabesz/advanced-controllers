import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../lib/index';
import { app, baseUrl } from './test-base';


declare var Promise;


class MissingDecoratorController extends web.BaseController {
	@web.get()
	anything() {}
}

@web.controller('some')
class SomeController extends web.BaseController {
	mwCalled = false;

	@web.middleware(function(req, res, next) { this.mwCalled = true; next(); })
	nohttpmethod() {}

}


@web.controller('some2')
class SomeController2 extends web.BaseController {
	nohttpmethod(
		@web.query('value', Number) value: number
	) {}
}

describe('Various Error Checks', () => {
	it('should not register not-decorated class', () => {
		let ctrl = new MissingDecoratorController();
		assert.throws(() => {
			ctrl.register(app);
		});
	});

	it('should not register an action without a method (but with middleware)', () => {
		let ctrl = new SomeController();
		assert.throws(() => {
			ctrl.register(app);
		});
	});

	it('should not register an action without a method (but with params)', () => {
		let ctrl = new SomeController2();
		assert.throws(() => {
			ctrl.register(app);
		});
	});
});
