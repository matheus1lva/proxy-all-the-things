const app = require("./testServer");
const request = require("supertest");
const stubServer = require("./stubServer");


describe("integration test", () => {
	let stubServerListener;

	beforeAll(() => {
		stubServerListener = stubServer();
	});

	it("hitting root route", async() => {
		const response = await request(app).get("/test");
		expect(response.text).toEqual("hello");
	});

	it("hitting /test/test123", async() => {
		const response = await request(app).get("/test/test123");
		expect(response.text).toEqual("test123");
	});

	it("test redirecting from /test/test1234 to /test/joke", async() => {
		const response = await request(app).get("/test/test1234").redirects(1);
		expect(response.text).toEqual("hu3hu3 hahaha");
	});

	afterAll(() => {
		stubServerListener.close();
	});

});
