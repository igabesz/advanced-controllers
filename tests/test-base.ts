import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as assert from 'assert';


export var app = express();
export var port = 8080;
export var baseUrl = `http://localhost:${port}/`;
app.use(bodyParser.json());


describe('Startup', () => {
	it('should start already', (done) => {
		app.listen(port, (err) => {
			assert(err === null || err === undefined);
			done();
		});
	});
});
