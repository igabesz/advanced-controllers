import { assert } from 'chai';
import * as web from '../dist/index';
import { app, baseUrl, assertStatusCode } from './test-base';
import * as request from 'request';


interface User {
	id: number;
}


@web.Controller('user-test')
@web.Public()
class UserController extends web.AdvancedController {
	@web.Get('ok')
	ok(@web.User() user: User): User { return user; }

	@web.Get('not-ok')
	notOk(@web.User() user: User): User { return user; }

	@web.Get('ok-fallback-to-auth')
	okFallbackToAuth(@web.User() user: User): User { return user; }
}


describe('User binding', () => {
	before(() => {
		app.use('/user-test/ok', (req, _res, next) => {
			(req as any).user = { id: 43 };
			next();
		});
		app.use('/user-test/ok-fallback-to-auth', (req, _res, next) => {
			(req as any).auth = { id: 43 };
			next();
		});
		const mainController = new UserController();
		mainController.register(app, { implicitAccess: true });
	});

	it('should have user at the good path', (done) => {
		request(baseUrl + 'user-test/ok', (error, response, body) => {
			assertStatusCode(error, response);
			const data = JSON.parse(body);
			assert.ok(data);
			assert.equal(data.id, 43);
			done();
		});
	});

	it('should have user at the good path as fallback to `auth`', (done) => {
		request(baseUrl + 'user-test/ok-fallback-to-auth', (error, response, body) => {
			assertStatusCode(error, response);
			const data = JSON.parse(body);
			assert.ok(data);
			assert.equal(data.id, 43);
			done();
		});
	});

	it('should not have user at the other path', (done) => {
		request(baseUrl + 'user-test/not-ok', (error, response, body) => {
			assertStatusCode(error, response);
			assert.equal(body, 'OK')
			done();
		});
	});

});
