const express = require("express");
const Proxy = require("../index");
const app = express();

const ProxyInstance = new Proxy({
	baseUrl: "http://localhost:3001/test",
	internalPath: "/test"
});

app.all("/test*", ProxyInstance.proxyHandler);
// app.listen(3000, () => {
// 	console.log("proxy listening to 300");
// });

module.exports = app;
