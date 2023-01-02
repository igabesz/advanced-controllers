import * as _ from 'lodash';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../dist/index';
import { app, baseUrl } from './test-base';


@web.Controller('some')
@web.Public()
class SomeController extends web.AdvancedController {
	mwCalled = false;

	@web.Middleware(function(this: SomeController, req, res, next) { this.mwCalled = true; next(); })
	nohttpmethod() {}
}

@web.Controller('some2')
@web.Public()
class SomeController2 extends web.AdvancedController {
	nohttpmethod(
		@web.Query('value', Number) value: number
	) {}
}

@web.Controller('some3')
@web.Public()
class SomeController3 extends web.AdvancedController {
	dontRegisterMe = () => {};

	@web.Get('2')
	registerMe() {}
}

@web.Controller('some3')
@web.Public()
class SomeController3Again extends web.AdvancedController {
	@web.Get('3')
	get() {}
}

@web.Controller('implicit-access')
class ImplicitAccessCtrl extends web.AdvancedController {
	@web.Get()
	get() { return { done: true }; }
}

@web.Controller('divergent-permissions')
class DivergentPermissions extends web.AdvancedController {
	@web.Permission('p1')
	@web.Get('/item')
	get() {}

	@web.Public()
	@web.Post('/item')
	post() {}
}

@web.Controller('not-divergent-permissions')
class NotDivergentPermissions extends web.AdvancedController {
	@web.Permission('p1')
	@web.Get('')
	get() {}

	@web.Permission('p1')
	@web.Post('')
	post() {}
}


describe('Various Error Checks', () => {
	let implicitCtrl: ImplicitAccessCtrl;

	it('should not instantiate a not-decorated class', () => {
		assert.throws(() => {
			class MissingDecoratorController extends web.AdvancedController {
				@web.Get()
				anything() {}
			}
			let ctrl = new MissingDecoratorController();
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

	it('should throw error on instantiation with the same controller name', () => {
		assert.throws(() => {
			let ctrl = new SomeController3Again();
		});
	});

	it('should require `implicitAccess` in settings', () => {
		implicitCtrl = new ImplicitAccessCtrl();
		assert.throws(() => {
			implicitCtrl.register(app);
		});
	});

	it('should enable implicit access when `implicitAccess` is in settings', done => {
		implicitCtrl.register(app, { implicitAccess: true });
		request.get(baseUrl + 'implicit-access/get', (err, res, body) => {
			assert(!err);
			assert.equal(res.statusCode, 200);
			let data = JSON.parse(body);
			assert.deepEqual(data, { done: true });
			done();
		});
	});

	it('should disallow divergent permissions', () => {
		let ctrl = new DivergentPermissions();
		assert.throws(() => {
			ctrl.register(app);
		}, (err: any) => err.message.indexOf('Divergent permissions') !== -1);
	});

	it('should not throw on different but not Public permissions on the same route (different methods)', () => {
		let ctrl = new NotDivergentPermissions();
		ctrl.register(app);
	});

});
