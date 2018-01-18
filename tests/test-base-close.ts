import { server } from './test-base';


describe('Close', () => {
	it('should close the server', done => {
		server.close(done);
	});
});
