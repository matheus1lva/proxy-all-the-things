const debug = require('debug')('proxy-all-the-things::');
const request = require('request');

const proxyableHeaders = ['accept', 'content-type', 'range', 'user-agent', 'cookie', 'host'];
const nonReturnableHeaders = ['server', 'host', 'content-length', 'x-powered-by', 'date', 'connection', 'x-powered-by'];

function proxyHandler(req, res, options) {
	const correlationId = uuid();
	const start = Date.now();
	const url = `${options.baseUrl}${req.url.replace(options.internalPath, '')}`;
	
	debug(`${correlationId} proxying to: ${url}`);

	const headers = {}

	// copy all suitable headers from the inbound request to the gsedw request
	Object.keys(req.headers)
	.filter(header => proxyableHeaders.indexOf(header) > -1)
	.forEach((header) => {
		headers[header] = req.headers[header];
	});
	
	const requestStream = request({
		method: req.method,
		url,
		headers,
		body: req.body,
		followRedirect: false
	});
}