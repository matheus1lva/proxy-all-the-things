const request = require('request');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');
const config = require('../../../config/project.config.js');
const co = require('co');

// base path of project.
const basePath = path.resolve(__dirname, '../../');

// path of log files
const successfulLogPath = path.resolve(basePath, 'logs/proxyLogs/successful.log');
const errorLogPath = path.resolve(basePath, 'logs/proxyLogs/errors.log');
const headersLog = path.resolve(basePath, 'logs/proxyLogs/headersDetailed.log');

// headers we can safely proxy
const proxyableHeaders = ['accept', 'content-type', 'range', 'user-agent', 'cookie', 'host'];
const nonReturnableHeaders = ['server', 'host', 'content-length', 'x-powered-by', 'date', 'connection', 'x-powered-by'];

const GSEDW_PATH_INTERNAL = config.proxy.internal.gsedwPrefix;
const GSDEW_PATH_EXTERNAL = config.proxy.external.gsedwPrefix;

// make sure log files exist.
function touch(pathToTouch) {
  fs.closeSync(fs.openSync(pathToTouch, 'w'));
}

const getUserType = co.wrap(function* (req, options) { //eslint-disable-line
  const userId = req.res.req.session.userId;
  const userObj = yield Promise.resolve(req.ceConnector.as('session-user').get(`/users/${userId}`));
  return yield userObj.json();
});

[successfulLogPath, errorLogPath, headersLog].forEach(touch);

function proxy(req, res, options) {
  getUserType(req, options).then((result) => {
    // setting up correlation ids to put on logs
    const correlationId = uuid();
    // date to see how much time the request has taken
    const start = Date.now();
    let baseUrl;

    const isBt = (result.companyName || '').toLowerCase().indexOf('bt') !== -1;
    if (isBt) {
      baseUrl = config.proxy.internal.gsedwUrl;
    } else {
      baseUrl = config.proxy.external.gsedwUrl;
    }

    const urlToAppend = options && options.appendUrl ? `/${options.appendUrl}` : '';
    let url = `${urlToAppend}${req.url.replace(GSDEW_PATH_EXTERNAL, '').replace(GSEDW_PATH_INTERNAL, '')}`;
    url = `${baseUrl}${url}`;

    req.log.info(`cid: ${correlationId} - reverse proxying to: ${url}`);

    const headers = {};
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

    const headersDetailed = `Headers being sent to gswd: ${JSON.stringify(headers)}\nDetailedRequest: ${JSON.stringify(requestStream, null, 4)}\n\n`;
    fs.appendFile(headersLog, headersDetailed, (error) => {
      if (error) throw error;
    });

    requestStream.on('response', (response) => {
      req.log.info(`cid: ${correlationId} - reverse proxying success. Status code: ${response.statusCode}`);

      // ensure we are having just the headers we want in the response resetting the object
      const headersCopy = Object.assign({}, response.headers);

      if (response.statusCode === 302) {
        req.log.error(`headers being sent to GSEDW, stringified... ${JSON.stringify(req.headers)}`);

        // with this url we know who actually answered.
        // then we can check if it is intenral or external.
        const hostRequested = response.connection._host;
        const isInternal = `http://${hostRequested}` === config.proxy.internal.gsedwUrl;

        let replacedLocation;
        if (isInternal) {
          replacedLocation = response.headers
            .location.replace(config.proxy.internal.gsedwUrl, req.headers.host);
        } else {
          // req.log.error('something else had to happen here but instead...');
          // if (response.headers.location.indexOf('.globalservices.bt.com') !== -1) {
          //   // that means it redirected to the gsp portal
          //   req.log.error('something hapenned that the proxy sent you to the gsp login page.');
          //   req.log.error(`im attaching the header cookie if you need them ${JSON.stringify(response.headers)} | they are stringified.`);
          //   // replacedLocation = response.headers.location.replace(/(https|http):\/\/www\.([^\.]+)\.globalservices.bt.com\//, req.headers.host); //eslint-disable-line
          // }
          replacedLocation = response.headers
            .location.replace(config.proxy.external.gsedwUrl, req.headers.host);
        }

        headersCopy.location = replacedLocation;
      }

      const timestamp = new Date().toISOString();
      if (response.statusCode === 200) {
        fs.appendFile(successfulLogPath, `${timestamp} Request url: ${req.url}\nResponse: ${JSON.stringify(response)}\n\n\n`, (error) => {
          if (error) throw error;
        });
      } else {
        fs.appendFile(errorLogPath, `${timestamp} Request url: ${req.url}\nResponse: ${JSON.stringify(response)}\n\n\n`, (error) => {
          if (error) throw error;
        });
      }

      response.headers = {};

      // copy all suitable headers from the gsdw response to the pending user agent response.
      Object.keys(headersCopy).filter(h => nonReturnableHeaders.indexOf(h) === -1)
        .forEach((h) => {
          response.headers[h] = headersCopy[h];
        });

      requestStream.pipe(res);
    }).on('end', () => {
      req.log.info(`cid: ${correlationId} - proxy destination answered, took ${Date.now() - start}ms`);
    }).on('error', (error) => {
      req.log.error(`cid: ${correlationId} - error proxying to ${url}: ${error}`);
    });

    return req.pipe(requestStream);
  }).catch((error) => {
    req.log.error(`error while creating the generator ${error}`);
  });
}

module.exports = (options) => {
  return (req, res) => {
    return proxy(req, res, options);
  };
};
