import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../lib/index';
import { app, baseUrl } from './test-base';


class MissingDecoratorController extends web.AdvancedController {
	@web.get()
	anything() {}
}

@web.controller('some')
class SomeController extends web.AdvancedController {
	mwCalled = false;

	@web.middleware(function(this: SomeController, req, res, next) { this.mwCalled = true; next(); })
	nohttpmethod() {}
}

@web.controller('some2')
class SomeController2 extends web.AdvancedController {
	nohttpmethod(
		@web.query('value', Number) value: number
	) {}
}

@web.controller('some3')
class SomeController3 extends web.AdvancedController {
	dontRegisterMe = () => {};

	@web.get('2')
	registerMe() {}
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

	it('should not throw error on member variables with function type', () => {
		let ctrl = new SomeController3();
		let regCnt = 0;
		ctrl.register(app, { debugLogger: () => regCnt++ });
		let permissions = ctrl.getPermissions();
		assert.equal(regCnt, 1);
	});
});
