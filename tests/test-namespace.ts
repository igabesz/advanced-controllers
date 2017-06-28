import * as _ from 'lodash';
import * as mocha from 'mocha';
import * as assert from 'assert';
import * as request from 'request';

import * as web from '../dist/index';
import { app, baseUrl } from './test-base';


const myNamespace = 'my-namespace';
const localBaseUrl = baseUrl + myNamespace + '/somectrl';

@web.Controller('somectrl')
class NamespaceController extends web.AdvancedController {
	@web.Public()
	@web.Get()
	test() { return { done: true }; }
}

let ctrl: NamespaceController;

describe('Namespace', () => {
	it('should be created and registered + AllowAnonymus on action', () => {
		ctrl = new NamespaceController();
		ctrl.register(app, { namespace: myNamespace });
	});

	it('should work with namespace', (done) => {
		request(`${localBaseUrl}/test`, (err, res, body) => {
			let data = JSON.parse(body);
			assert(!err);
			assert.equal(res.statusCode, 200);
			assert.deepEqual(data, { done: true });
			done();
		});
	});
});
