import * as assert from 'assert';
import * as request from 'request';

import * as web from '../dist/index';
import { app, baseUrl } from './test-base';


const localBaseUrl = baseUrl + 'static-round2/';


@web.Controller('static-round2')
class StaticTestController extends web.AdvancedController {
	@web.Permission('static-11')
	@web.Get('get1')
	get() { return 'static-11'; }

	@web.Permission('static-12')
	@web.Get('get2')
	get2() { return 'static-12'; }
}



// NOTE This test must be the last because it changes the authorization method
describe('Role based authorization', () => {

	let errCnt = 0;
	let ctrl: StaticTestController;
	let assertStatusCode = (err, res, body) => {
		assert(!err);
		assert.equal(res.statusCode, 200);
		return body;
	};

	it('should prepare correctly', () => {
		web.AdvancedController.setRoles([
			{ name: 'test', permissions: ['static-11'] },
		]);
		app.use('/static-round2*', (req, res, next) => {
			(req as any).user = {
				roles: ['test'],
				hasPermission: () => true,
			};
			next();
		});
		ctrl = new StaticTestController();
		ctrl.register(app, { errorLogger: () => errCnt++ });
	});

	it('should allow role based authentication', (done) => {
		request.get(localBaseUrl + 'get1', (err, res, body) => {
			let data = assertStatusCode(err, res, body);
			assert.equal(data, 'static-11');
			assert.equal(errCnt, 0);
			done();
		});
	});

	it('should filter unauthorized accesses even with hasPermission', (done) => {
		request.get(localBaseUrl + 'get2', (err, res, body) => {
			assert.throws(() => {
				assertStatusCode(err, res, body);
			});
			let data = JSON.parse(body);
			assert.equal(data.errors[0].message, 'Unauthorized');
			assert.equal(errCnt, 0);
			done();
		});
	});

	it('should allow the changes in roles ', (done) => {
		// Add + revoke role
		web.AdvancedController.setRoles([
			{ name: 'test', permissions: ['static-12'] },
		]);
		// This is added
		request.get(localBaseUrl + 'get2', (err, res, body) => {
			let data = assertStatusCode(err, res, body);
			assert.equal(data, 'static-12');
			// This is revoked
			request.get(localBaseUrl + 'get1', (err2, res2, body2) => {
				assert.throws(() => {
					assertStatusCode(err2, res2, body2);
				});
				assert.equal(errCnt, 0);
				done();
			});
		});

	});


});
