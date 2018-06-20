const express = require("express");
const stubServer = express();

stubServer.get("/test", (req, res) => {
	res.send("hello");
});

stubServer.get("/test/test123", (req, res) => {
	res.send("test123");
});

stubServer.get("/test/test1234", (req, res) => {
	res.redirect("/test/joke");
});

stubServer.get("/test/joke", (req, res) => {
	res.send("hu3hu3 hahaha");
});

// stubServer.listen(3001);

module.exports = () => {
	return stubServer.listen(3001);
};
