var Transform = require('pipestream').Transform;
var EventEmitter = require('events').EventEmitter;
var zlib = require('../util/zlib');
var util = require('../util');
var config = require('../config');

var MAX_BODY_SIZE = 360 * 1024;
var MAX_SIZE = (config.strict ? 256 : 512) * 1024;
var LOCALHOST = '127.0.0.1';

function unzipBody(options, body, callback) {
  zlib.unzip(options.headers['content-encoding'], body, callback);
}

function getChunkLen(chunk) {
  return chunk && chunk.length || 0;
}

function checkType(res) {
  if (!config.strict) {
    return true;
  }
  var type = res.headers['content-type'];
  if (!type) {
    return true;
  }
  type = util.getContentType(type);
  return type && type !== 'CSS' && type !== 'IMG';
}

function checkBodySize(data) {
  if (config.strict && data.body && data.body.length > MAX_BODY_SIZE) {
    data.body = '';
  }
}

function emitDataEvents(req, res, proxy) {
  var now = Date.now();
  proxy.emit('_request', req.fullUrl);
  var showHttpData = !req.filter.hide && util.listenerCount(proxy, 'request');
  if (!showHttpData) {
    return;
  }
  var _res = {};
  var reqEmitter = new EventEmitter();
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
  var reqBody = false;
  var resBody = false;
  var cleared;
  var data = {
    startTime: now,
    id: req.reqId,
    url: req.fullUrl,
    req: reqData,
    res: resData,
    rules: req.rules,
    pipe: req._pipeRule,
    rulesHeaders: req.rulesHeaders,
    abort: function(clear) {
      if (clear === true) {
        data = reqData = resData = reqBody = resBody = false;
        cleared = true;
      } else {
        req.emit('error', new Error('Aborted'));
      }
    }
  };
  proxy.emit('request', reqEmitter, data);

  var requestTime;
  var endTime;
  var unzipResBody;
  req.setServerPort = function(serverPort) {
    resData.port = serverPort;
  };
  req.once('dest', function(_req) {
    setReqStatus();
    var reqSize = 0;
    var write = _req.write;
    var end = _req.end;
    if (!cleared && util.hasRequestBody(req)) {
      reqBody = showHttpData ? null : '';
    }
    _req.write = function(chunk) {
      if (chunk) {
        if (reqBody || reqBody === null) {
          reqBody = reqBody ? Buffer.concat([reqBody, chunk]) : chunk;
          if (reqBody.length > MAX_SIZE) {
            reqBody = false;
          }
        }
        reqSize += chunk.length;
      }
      return write.apply(this, arguments);
    };
    _req.end = function(chunk) {
      reqSize += getChunkLen(chunk);
      reqData.size = reqSize;
      requestTime =  Date.now();
      unzipBody(req, reqBody, function(err, body) {
        data.requestTime = requestTime;
        reqData.body = err ? util.getErrorStack(err) : body;
        checkBodySize(reqData);
        unzipResBody && unzipResBody();
      });
      return end.apply(this, arguments);
    };
    reqEmitter.emit('send', data);
  });
  res.once('src', function(r) {
    _res = r;
    if (!cleared && util.hasBody(_res) && checkType(_res)) {
      if (_res.headers['content-length'] > MAX_SIZE) {
        resBody = false;
      } else {
        resBody = showHttpData ? null : '';
      }
    }
    var resSize = 0;
    var write = res.write;
    var end = res.end;
    res.write = function(chunk) {
      if (chunk) {
        if (resBody || resBody === null) {
          resBody = resBody ? Buffer.concat([resBody, chunk]) : chunk;
          if (resBody.length > MAX_SIZE) {
            resBody = false;
          }
        }
        resSize += chunk.length;
      }
      return write.apply(this, arguments);
    };
    res.end = function(chunk) {
      resSize += getChunkLen(chunk);
      resData.size = resSize;
      endTime =  Date.now();
      delete data.abort;
      unzipResBody = function() {
        unzipResBody = null;
        unzipBody(res, resBody, function(err, body) {
          resData.body = err ? util.getErrorStack(err) : body;
          checkBodySize(resData);
          data.endTime = endTime;
          reqEmitter.emit('end', data);
        });
      };
      data.requestTime && unzipResBody();
      return end.apply(this, arguments);
    };
    data.pipe = req._pipeRule;
    resData.rawHeaderNames = r.rawHeaderNames;
    if (!data.endTime) {
      setResStatus();
      reqEmitter.emit('response', data);
    }
  });
  req.once('close', handleError);
  req.once('error', handleError);
  res.once('error', handleError);

  function handleError(err) {
    if ((!err || !err._resError) && (data.endTime || (data.responseTime && !err))) {//connection: close的时候，还要数据缓存
      return;
    }
    clearTimeout(req.timeoutId);
    req.hasError = true;
    data.endTime = endTime || Date.now();
    delete data.abort;
    if (err && err.message !== 'Aborted') {
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
  }

  function setReqStatus(defaultHost) {
    data.dnsTime = (req.dnsTime || 0) + now;
    data.realUrl = data.url === req.realUrl ? undefined : req.realUrl;
    resData.ip = req.hostIp || defaultHost;
  }

  function setResStatus(defaultCode) {
    setReqStatus(LOCALHOST);
    resData.statusCode = _res.statusCode || defaultCode || 502;
    resData.statusMessage = _res.statusMessage;
    if (!data.requestTime) {
      data.requestTime = requestTime || Date.now();
    }
    data.responseTime = Date.now();
    resData.headers = _res.headers;
    resData.trailers = _res.trailers;
  }
}

function addTimeout(req, res, timeout, custom) {
  if (!(timeout > 0) || req.disable.timeout) {
    return;
  }
  if (!custom && util.isMultipart(req)) {
    timeout *= 2;
  }
  var responsed;
  var preReq = new Transform();
  var endReq = new Transform();
  var preRes = new Transform();
  var endRes = new Transform();

  preReq._transform = preRes._transform = function(chunk, encoding, callback) {
    req.timeoutId && clearTimeout(req.timeoutId);
    req.timeoutId = null;
    callback(null, chunk);
  };

  endReq._transform = endRes._transform = function(chunk, encoding, callback) {
    req.timeoutId && clearTimeout(req.timeoutId);
    if (!responsed || chunk) {
      req.timeoutId = setTimeout(emitTimeoutError, timeout);
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
  addTimeout(req, res, req.timeout || config.timeout, req.timeout);
  if (req.filter.abort || req.enable.abort) {
    var reqDelay = util.getMatcherValue(req.rules.reqDelay);
    if (reqDelay > 0) {
      return setTimeout(function() {
        res.destroy();
      }, reqDelay);
    }
    return res.destroy();
  }
  next();
};




