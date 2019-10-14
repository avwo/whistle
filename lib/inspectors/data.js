var EventEmitter = require('events').EventEmitter;
var zlib = require('../util/zlib');
var util = require('../util');
var config = require('../config');

var MAX_BODY_SIZE = 360 * 1024;
var MAX_SIZE = (config.strict ? 256 : 512) * 1024;
var MAX_RES_BODY_SIZE = (config.strict ? 256 : 1536) * 1024;
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

function isUnzipJs(r) {
  r = r.headers;
  return !r['content-encoding'] && util.getContentType(r) === 'JS';
}

function emitDataEvents(req, res, proxy) {
  var now = Date.now();
  proxy.emit('_request', req.fullUrl);
  var showHttpData = !req.isPluginReq && !config.rulesMode && (!req.filter.hide || req.disable.hide) && util.listenerCount(proxy, 'request');
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
        var err = new Error('Aborted');
        err.code = 'ERR_WHISTLE_ABORTED';
        req.emit('error', err);
      }
    }
  };
  proxy.emit('request', reqEmitter, data);

  var requestTime;
  var endTime;
  var unzipResBody;
  var updateVersion = function() {
    data.useH2 = req.useH2;
    if (req.useH2) {
      reqData.httpVersion = '2.0';
    }
  };
  req.setServerPort = function(serverPort) {
    updateVersion();
    if (serverPort) {
      resData.port = serverPort;
    }
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
        reqBody = err ? util.getErrorStack(err) : body;
        reqData.body = reqBody;
        checkBodySize(reqData);
        unzipResBody && unzipResBody();
      });
      return end.apply(this, arguments);
    };
    reqEmitter.emit('send', data);
  });
  res.once('src', function(r) {
    _res = r;
    var MAX_RES_BODY = isUnzipJs(r) ? MAX_RES_BODY_SIZE : MAX_SIZE;
    if (!cleared && util.hasBody(_res, req) && checkType(_res)) {
      if (_res.headers['content-length'] > MAX_RES_BODY) {
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
          if (resBody.length > MAX_RES_BODY) {
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
          resBody = err ? util.getErrorStack(err) : body;
          resData.body = resBody;
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
    req.hasError = true;
    if ((!err || !err._resError) && (data.endTime || (data.responseTime && !err))) {//connection: close的时候，还要数据缓存
      return;
    }
    clearTimeout(req.timeoutId);
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
    updateVersion();
    resData.ip = req.hostIp || defaultHost;
    resData.phost = req._phost && req._phost.host;
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

module.exports = function(req, res, next) {
  emitDataEvents(req, res, this);
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




