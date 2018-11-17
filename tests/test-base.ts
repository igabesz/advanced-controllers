import * as express from 'express';
import * as bodyParser from 'body-parser';
import { assert } from 'chai';
import * as http from 'http';


export const port = 8080;
export const baseUrl = `http://localhost:${port}/`;
export const app = express();
export let server: http.Server;
app.use(bodyParser.json());


describe('Startup', () => {
	it('should start already', (done) => {
		server = app.listen(port, (err) => {
			assert(err === null || err === undefined);
			done();
		});
	});
});


export function assertStatusCode(err, res) {
	assert.notOk(err);
	assert.equal(res.statusCode, 200);
};
