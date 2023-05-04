import { assert } from 'chai';
import * as web from '../dist/index';
import { app, baseUrl, assertStatusCode } from './test-base';
import * as request from 'request';


interface Auth {
	id: number;
}


@web.Controller('auth-test')
@web.Public()
class UserController extends web.AdvancedController {
	@web.Get('ok')
	ok(@web.Auth() auth: Auth): Auth { return auth; }

	@web.Get('not-ok')
	notOk(@web.Auth() auth: Auth): Auth { return auth; }
}


describe('Auth binding', () => {
	before(() => {
		app.use('/auth-test/ok', (req, _res, next) => {
			(req as any).auth = { id: 43 };
			next();
		});
		const mainController = new UserController();
		mainController.register(app, { implicitAccess: true });
	});

	it('should have auth at the good path', (done) => {
		request(baseUrl + 'auth-test/ok', (error, response, body) => {
			assertStatusCode(error, response);
			const data = JSON.parse(body);
			assert.ok(data);
			assert.equal(data.id, 43);
			done();
		});
	});

	it('should not have auth at the other path', (done) => {
		request(baseUrl + 'auth-test/not-ok', (error, response, body) => {
			assertStatusCode(error, response);
			assert.equal(body, 'OK')
			done();
		});
	});

});
