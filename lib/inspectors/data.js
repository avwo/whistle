var EventEmitter = require('events').EventEmitter;
var zlib = require('../util/zlib');
var util = require('../util');
var config = require('../config');

var MAX_BODY_SIZE = 360 * 1024;
var MAX_SIZE = (config.strict ? 256 : 512) * 1024;
var MAX_RES_BODY_SIZE = (config.strict ? 256 : 1536) * 1024;
var LOCALHOST = '127.0.0.1';

function unzipBody(options, body, callback) {
  var type = options.headers && options.headers['content-encoding'];
  return zlib.unzip(type, body, callback);
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
    headers: req.headers
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
    data.httpsTime = req.httpsTime;
    data.useHttp = req.useHttp;
    if (req.useH2 && !req.useHttp) {
      reqData.httpVersion = '2.0';
    } else {
      reqData.httpVersion = '1.1';
    }
  };
  var setUnzipSize = function(body, obj) {
    var len = body ? body.length : -1;
    if (len >= 0 && len !== obj.size) {
      obj.unzipSize = len;
    }
  };
  req.setServerPort = function(serverPort) {
    setReqStatus(LOCALHOST);
    resData.port = serverPort;
  };
  req.setClientId = function(clientId) {
    data.clientId = clientId;
  };
  res.setCurTrailers = function(trailers, rawTrailerNames) {
    resData.trailers = trailers;
    resData.rawTrailerNames = rawTrailerNames;
  };
  var reqDone, resDone;

  var handleReqBody = function(stream, info) {
    if (reqDone) {
      return;
    }
    reqDone = true;
    info = info || (req._needGunzip ? { method: req.method, headers: '' } : req);
    if (!cleared && util.hasRequestBody(info)) {
      reqBody = showHttpData ? null : '';
    }
    reqData.size = 0;
    var write = stream.write;
    var end = stream.end;
    stream.write = function(chunk) {
      if (chunk) {
        if (reqBody || reqBody === null) {
          reqBody = reqBody ? Buffer.concat([reqBody, chunk]) : chunk;
          if (reqBody.length > MAX_SIZE) {
            reqBody = false;
          }
        }
        reqData.size += chunk.length;
      }
      return write.apply(this, arguments);
    };
    stream.end = function(chunk) {
      reqData.size += getChunkLen(chunk);
      requestTime =  Date.now();
      unzipBody(info, reqBody, function(err, body) {
        data.requestTime = requestTime;
        reqBody = err ? util.getErrorStack(err) : body;
        reqData.body = reqBody;
        setUnzipSize(body, reqData);
        checkBodySize(reqData);
        unzipResBody && unzipResBody();
      });
      return end.apply(this, arguments);
    };
  };
  var handleResBody = function(stream, info) {
    if (resDone) {
      return;
    }
    resDone = true;
    info = info || (res._needGunzip ? { statusCode: res.statusCode, headers: '' } : res);
    var MAX_RES_BODY = isUnzipJs(info) ? MAX_RES_BODY_SIZE : MAX_SIZE;
    if (!cleared && util.hasBody(info, req) && checkType(info)) {
      if (info.headers['content-length'] > MAX_RES_BODY) {
        resBody = false;
      } else {
        resBody = showHttpData ? null : '';
      }
    }
    resData.size = 0;
    var write = stream.write;
    var end = stream.end;
    stream.write = function(chunk) {
      if (chunk) {
        if (resBody || resBody === null) {
          resBody = resBody ? Buffer.concat([resBody, chunk]) : chunk;
          if (resBody.length > MAX_RES_BODY) {
            resBody = false;
          }
        }
        resData.size += chunk.length;
      }
      return write.apply(this, arguments);
    };
    stream.end = function(chunk) {
      resData.size += getChunkLen(chunk);
      endTime =  Date.now();
      delete data.abort;
      unzipResBody = function() {
        unzipResBody = null;
        resData.hasGzipError = unzipBody(info, resBody, function(err, body) {
          resBody = err ? util.getErrorStack(err) : body;
          resData.body = resBody;
          setUnzipSize(body, resData);
          checkBodySize(resData);
          data.endTime = endTime;
          reqEmitter.emit('end', data);
        });
      };
      data.requestTime && unzipResBody();
      return end.apply(this, arguments);
    };
  };

  var hasReqPipe = req._pipePluginPorts.reqWritePort;
  var hasResPipe = req._pipePluginPorts.resWritePort;

  if (hasReqPipe) {
    req.on('bodyStreamReady', handleReqBody);
  }

  if (hasResPipe) {
    res.on('bodyStreamReady', handleResBody);
  }

  req.once('dest', function(_req) {
    setReqStatus();
    reqEmitter.emit('send', data);
    !hasReqPipe && handleReqBody(_req, req);
  });
  res.once('src', function(r) {
    _res = r;
    data.pipe = req._pipeRule;
    resData.rawHeaderNames = res.rawHeaderNames;
    if (!data.endTime) {
      setResStatus();
      reqEmitter.emit('response', data);
    }
    !hasResPipe && handleResBody(res, _res);
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
      data.requestTime = requestTime || data.dnsTime || Date.now();
    }
    data.responseTime = Date.now();
    resData.headers = _res.headers;
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




