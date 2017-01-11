import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../lib/index';
import { app, baseUrl } from './test-base';


const localBaseUrl = baseUrl + 'perm';
const authenticator = new class {
	enabled = false;
	permissions: string[] = [];
	mw = (req, res, done) => {
		if (this.enabled) {
			req.user = {
				hasPermission: (perm) => this.permissions.indexOf(perm) !== -1,
			};
		}
		done();
	}
}();

@web.controller('perm')
class PermissionController extends web.BaseController {
	@web.permission()
	@web.get('test1-a')
	testOneA() { return { done: true }; }

	@web.permission()
	@web.get()
	testOneB() { return { done: true }; }

	@web.permission('perm:test-two')
	@web.post('test2')
	testTwo() { return { done: true }; }

	@web.get('noperm')
	noPerm() { return { done: true }; }
}

let ctrl: PermissionController;
let permissionsShouldBe = [
	'perm:test1-a',
	'perm:testOneB',
	'perm:test-two',
];

describe('Permission', () => {
	it('should be created and registered', () => {
		app.use(authenticator.mw);
		ctrl = new PermissionController();
		ctrl.register(app, () => {});
	});

	it('should have good permissions', () => {
		let permissions = ctrl.getAllPermissions();
		assert.equal(permissions.length, permissionsShouldBe.length);
		for (let perm of permissionsShouldBe) {
			assert.notEqual(permissions.indexOf(perm), -1, `Missing permission: ${perm}`);
		}
	});

	it('should pass on no-check', (done) => {
		request(`${localBaseUrl}/noperm`, (err, res, body) => {
			let data = JSON.parse(body);
			assert(!err);
			assert.equal(res.statusCode, 200);
			assert.deepEqual(data, { done: true });
			done();
		});
	});

	it('should fail [401] without authentication (req.user)', (done) => {
		request(`${localBaseUrl}/test1-a`, (err, res, body) => {
			let data = JSON.parse(body);
			assert(!err);
			assert.equal(res.statusCode, 401);
			assert(data.errors);
			assert(data.errors[0]);
			assert.equal(data.errors[0].message, 'Unauthenticated');
			done();
		});
	});

	it('should pass with authentication and good permissions', (done) => {
		authenticator.enabled = true;
		authenticator.permissions.push('perm:test-two');
		request.post(`${localBaseUrl}/test2`, {}, (err, res, body) => {
			let data = JSON.parse(body);
			assert(!err);
			assert.equal(res.statusCode, 200);
			assert.deepEqual(data, { done: true });
			done();
		});
	});

	it('should fail [403] with wrong permissions', (done) => {
		request(`${localBaseUrl}/testOneB`, (err, res, body) => {
			let data = JSON.parse(body);
			assert(!err);
			assert.equal(res.statusCode, 403);
			assert(data.errors);
			assert(data.errors[0]);
			assert.equal(data.errors[0].message, 'Unauthorized');
			done();
		});
	});
});