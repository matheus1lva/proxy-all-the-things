const debug = require('debug')('proxy-all-the-things::proxy');
const request = require('request');

const proxyableHeaders = ['accept', 'content-type', 'range', 'user-agent', 'cookie', 'host'];
const nonReturnableHeaders = ['server', 'host', 'content-length', 'x-powered-by', 'date', 'connection', 'x-powered-by'];

function proxyHandler(req, res, options) {
	const correlationId = uuid();
	const start = Date.now();
	const url = `${options.baseUrl}${req.url.replace(options.internalPath, '')}`;
	
	debug(`${correlationId} proxying to: ${url}`);

	const headers = {}

	/**
	 * Copy all suitable headers from the inbound request 
	 * to be sent to the destination
	 */
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

	requestStream.on('response', (response) => {
		debug(`cid: ${correlationId} - proxied successfully. Status code: ${response.statusCode}`)
		const headersCopy = Object.assign({}, response.headers);

		// we reached a redirect
		if (response.statusCode === 302) {
			headersCopy.location = response.headers.location.replace(options.baseUrl, req.headers.host)
		}

		response.headers = {};

		// copy all suitable headers from the gsdw response to the pending user agent response.
		Object.keys(headersCopy).filter(h => nonReturnableHeaders.indexOf(h) === -1)
			.forEach((h) => {
				response.headers[h] = headersCopy[h];
			});

		requestStream.pipe(res);

	}).on('end', () => {
		debug(`cid: ${correlationId} - proxy destination answered, took ${Date.now() - start}ms`)
	}).on('error', (error) => {
		debug(`cid: ${correlationId} - error proxying to ${url}: ${error}`);
	});
}

module.exports = (options) => {
	return (req, res) => {
		return proxyHandler(req, res, options);
	}
}