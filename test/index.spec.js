const app = require("./testServer");
const request = require("supertest");
const stubServer = require("./stubServer");


describe("integration test", () => {
	let stubServerListener;

	beforeAll(() => {
		stubServerListener = stubServer();
	});

	it("hitting root route", (done) => {
		request(app)
			.get("/test")
			.end((error, response) => {
				expect(response.text).toEqual("hello");
				done();
			});
	});

	it("hitting /test/test123", (done) => {
		request(app)
			.get("/test/test123")
			.end((error, response) => {
				expect(response.text).toEqual("test123");
				done();
			});
	});

	it("test redirecting from /test/test1234 to /test/joke", (done) => {
		request(app)
			.get("/test/test1234")
			.redirects(1)
			.end((error, response) => {
				expect(response.text).toEqual("hu3hu3 hahaha");
				done();
			});
	});

	afterAll(() => {
		stubServerListener.close();
	});

});
