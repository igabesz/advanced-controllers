import * as assert from 'assert';
import * as request from 'request';

import * as web from '../dist/index';
import { app, baseUrl } from './test-base';


@web.Controller('static-1')
class Static1TestController extends web.AdvancedController {
	@web.Permission('static-1')
	@web.Get()
	get() { return 'get'; }
}

@web.Controller('static-2')
class Static2TestController extends web.AdvancedController {
	@web.Permission('static-2a')
	@web.Get()
	get() { return 'get'; }

	@web.Permission('static-2b')
	@web.Post()
	post() { return 'post'; }

	@web.Get('get-no-perm')
	@web.Public()
	getNoPerm() { return 'get-no-perm'; }
}

@web.Permission('static-3')
@web.Controller('static-3')
class Static3TestController extends web.AdvancedController {
	@web.Get()
	get() { return 'get'; }
}

// NOTE This test must be first because it is based on all existing controllers so far
describe('Static AdvancedController', () => {

	let ctrls: web.AdvancedController[];
	let assertAndParse = (err, res, body) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
		return JSON.parse(body);
	};

	before(() => {
		ctrls = [
			new Static1TestController(),
			new Static2TestController(),
			new Static3TestController(),
		];
	});

	it('should register all', () => {
		let registeredCnt = 0;
		web.AdvancedController.registerAll(app, {
			debugLogger: (msg, data) => registeredCnt++,
			errorLogger: (err) => assert.fail(0, 1, 'Failed to register', err),
		});
		assert.equal(registeredCnt, 5);
	});

	it('should return get', (done) => {
		request.get(baseUrl + 'static-2/get-no-perm', (err, res, body) => {
			let data = assertAndParse(err, res, body);
			assert.equal(data, 'get-no-perm');
			done();
		});
	});

	it('should return all permissions', () => {
		let permissions = web.AdvancedController.getAllPermissions();
		assert.equal(permissions.length, 4);
		assert.notEqual(permissions.indexOf('static-1'), -1);
		assert.notEqual(permissions.indexOf('static-2a'), -1);
		assert.notEqual(permissions.indexOf('static-2b'), -1);
		assert.notEqual(permissions.indexOf('static-3'), -1);
	});

	it('should have correct global public routees', () => {
		let publicRoutes = web.AdvancedController.getAllPublicRoutes();
		assert.equal(publicRoutes.length, 1);
		assert.equal(publicRoutes[0], '/static-2/get-no-perm');
	});
});
