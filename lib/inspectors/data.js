var zlib = require('../util/zlib');
var fs = require('fs');
var fse = require('fs-extra2');
var MAX_SIZE = 512 * 1024;
var LOCALHOST = '127.0.0.1';
var util = require('../util');
var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;

function passThrough(chunk, encoding, callback) {
  callback(null, chunk);
}

function unzip(encoding, body, callback) {
  if (body) {
    encoding = util.toLowerCase(encoding);
    if (encoding === 'gzip') {
      return zlib.gunzip(body, callback);
    }
    if (encoding === 'deflate') {
      return zlib.inflate(body, function(err, data) {
        err ? zlib.inflateRaw(body, callback) : callback(null, data);
      });
    }
  }
  return callback(null, body);
}

function emitDataEvents(req, res, proxy) {
  var now = Date.now();
  var exportsFile = util.getMatcherValue(req.rules.exports);
  proxy.emit('_request', req.fullUrl);
  var showHttpData = !req.filter.hide && util.listenerCount(proxy, 'request');
  if (!exportsFile && !showHttpData) {
    return;
  }
  var _res = {};
  var reqEmitter = new EventEmitter();
  var request = new Transform();
  var response = new Transform();
  var reqData = {
    method: util.toUpperCase(req.method) || 'GET',
    httpVersion: req.httpVersion || '1.1',
    ip: req.clientIp,
    port: req.clientPort,
    isWhistleHttps: req.isWhistleHttps,
    rawHeaderNames: req.rawHeaderNames,
    headers: req.headers,
    trailers: req.trailers
  };
  var resData = {};
  var data = request.data = {
    startTime: now,
    id: req.reqId,
    url: req.fullUrl,
    req: reqData,
    res: resData,
    rules: req.rules,
    rulesHeaders: req.rulesHeaders
  };
  req.setServerPort = function(serverPort) {
    resData.port = serverPort;
  };
  req.once('dest', function() {
    setReqStatus();
    reqEmitter.emit('send', data);
  });
  res.once('src', function(res) {
    _res = res;
    resData.rawHeaderNames = res.rawHeaderNames;
    if (data.endTime) {
      return;
    }

    receiveResBody();
    setResStatus();
    reqEmitter.emit('response', data);
  });
  req.once('close', handleError);
  req.once('error', handleError);
  res.once('error', handleError);
  req.append(request);
  res.append(response);

  reqEmitter.data = data;
  if (!req.filter.hide) {
    proxy.emit('request', reqEmitter);
  }

  var reqBody = false;
  var reqSize = 0;

  if (util.hasRequestBody(req)) {
    reqBody = showHttpData ? null : '';
  }
  request._transform = function(chunk, encoding, callback) {
    if (chunk) {
      if (reqBody || reqBody === null) {
        reqBody = reqBody ? Buffer.concat([reqBody, chunk]) : chunk;
        if (reqBody.length > MAX_SIZE) {
          reqBody = false;
        }
      }
      reqSize += chunk.length;
      return callback(null, chunk);
    }
    reqData.size = reqSize;
    unzip(req.headers['content-encoding'], reqBody, function(err, body) {
      data.requestTime = Date.now();
      reqData.body = err ? util.getErrorStack(err) : body;
      callback(null, chunk);
    });
  };

  function receiveResBody() {
    var resBody = false;
    var resSize = 0;
    if ((!_res.headers['content-type'] || req.enable.inspect
      || util.getContentType(_res.headers)) && util.hasBody(_res)) {
      if (_res.headers['content-length'] > MAX_SIZE) {
        resBody = false;
      } else {
        resBody = showHttpData ? null : '';
      }
    }

    response._transform = function(chunk, encoding, callback) {
      if (chunk) {
        if (resBody || resBody === null) {
          resBody = resBody ? Buffer.concat([resBody, chunk]) : chunk;
          if (resBody.length > MAX_SIZE) {
            resBody = false;
          }
        }
        resSize += chunk.length;
        callback(null, chunk);
      } else {
        resData.size = resSize;
        unzip(_res.headers['content-encoding'], resBody, function(err, body) {
          resData.body = err ? util.getErrorStack(err) : body;
          data.endTime = Date.now();
          reqEmitter.emit('end', data);
          callback(null, chunk);
          writeExportsFile();
        });
      }
    };
  }

  function handleError(err) {
    if ((!err || !err._resError) && (data.endTime || (data.responseTime && !err))) {//connection: close的时候，还要数据缓存
      return;
    }

    request._transform = passThrough;
    response._transform = passThrough;
    data.endTime = Date.now();
    if (err) {
      data.resError = true;
      resData.body = util.getErrorStack(err);
      util.emitError(reqEmitter, data);
      setResStatus(502);
    } else {
      data.reqError = true;
      if (!reqData.body) {
        reqData.body = 'aborted';
      }
      reqEmitter.emit('abort', data);
      setResStatus('aborted');
    }
    writeExportsFile();
  }

  function setReqStatus(defaultHost) {
    data.dnsTime = (req.dnsTime || 0) + now;
    data.realUrl = req.realUrl;
    resData.ip = req.hostIp || defaultHost;
  }

  function setResStatus(defaultCode) {
    setReqStatus(LOCALHOST);
    resData.statusCode = _res.statusCode || defaultCode || 502;
    resData.statusMessage = _res.statusMessage;
    if (!data.requestTime) {
      data.requestTime = Date.now();
    }
    data.responseTime = Date.now();
    resData.headers = _res.headers;
    resData.trailers = _res.trailers;
  }

  function writeExportsFile() {
    if (!exportsFile) {
      return;
    }
    exportsFile = util.join(req.rules.exports.root, exportsFile);
    fse.ensureFile(exportsFile, function(err) {
      if (err) {
        return;
      }

      fs.writeFile(exportsFile, '\r\n' + JSON.stringify({
        reqId: req.reqId,
        startTime: data.startTime,
        dnsTime: data.dnsTime,
        requestTime: data.requestTime,
        responseTime: data.responseTime,
        endTime: data.endTime,
        url: data.url,
        realUrl: data.url == data.realUrl ? undefined : data.realUrl,
        method: reqData.method,
        httpVersion: reqData.httpVersion,
        clientIp: reqData.ip,
        reqError: data.reqError,
        reqSize: reqData.size,
        reqHeaders: reqData.headers,
        reqBody: reqData.body,
        reqTrailers: reqData.trailers,
        statusCode: resData.statusCode,
        hostIp: resData.ip,
        resError: data.resError,
        resSize: resData.size,
        resHeaders: resData.headers,
        resBody: resData.body,
        resTrailers: resData.trailers,
        rules: req.rules
      }), {flag: 'a'}, util.noop);
    });
  }
}

function addTimeout(req, res, timeout, custom) {
  if (!(timeout > 0) || req.disable.timeout) {
    return;
  }
  if (!custom && util.isMultipart(req)) {
    timeout *= 2;
  }
  var timeoutId, responsed;
  var preReq = new Transform();
  var endReq = new Transform();
  var preRes = new Transform();
  var endRes = new Transform();

  preReq._transform = preRes._transform = function(chunk, encoding, callback) {
    timeoutId && clearTimeout(timeoutId);
    timeoutId = null;
    callback(null, chunk);
  };

  endReq._transform = endRes._transform = function(chunk, encoding, callback) {
    timeoutId && clearTimeout(timeoutId);
    if (!responsed || chunk) {
      timeoutId = setTimeout(emitTimeoutError, timeout);
    }

    if (!chunk) {
      responsed = true;
    }

    callback(null, chunk);
  };

  function emitTimeoutError() {
    util.emitError(responsed ? res : req, new Error('Timeout'));
  }

  req.prepend(preReq).append(endReq);
  res.prepend(preRes).append(endRes);
}

module.exports = function(req, res, next) {
  emitDataEvents(req, res, this);
  addTimeout(req, res, req.timeout || this.config.timeout, req.timeout);
  if (req.filter.abort || req.enable.abort) {
    var reqDelay = util.getMatcherValue(req.rules.reqDelay);
    if (reqDelay > 0) {
      return setTimeout(function() {
        res.destroy();
        next();
      }, reqDelay);
    }
    res.destroy();
  }
  next();
};




