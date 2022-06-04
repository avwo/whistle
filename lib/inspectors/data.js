var EventEmitter = require('events').EventEmitter;
var zlib = require('../util/zlib');
var util = require('../util');
var socketMgr = require('../socket-mgr');
var config = require('../config');

var MAX_BODY_SIZE = 360 * 1024;
var MAX_SIZE = (config.strict ? 256 : 768) * 1024;
var MAX_REQ_BODY_SIZE = (config.strict ? 256 : 1536) * 1024;
var MAX_RES_BODY_SIZE = (config.strict ? 256 : 1536) * 1024;
var BIG_DATA_SIZE = 1024 * 1024 * 10;
var LOCALHOST = '127.0.0.1';

function getZipType(options) {
  return options.headers && options.headers['content-encoding'];
}

function unzipBody(options, body, callback) {
  return zlib.unzip(getZipType(options), body, callback);
}

function getChunkLen(chunk) {
  return (chunk && chunk.length) || 0;
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

function checkBodySize(data, useBigData) {
  if (
    config.strict &&
    data.body &&
    data.body.length > (useBigData ? BIG_DATA_SIZE : MAX_BODY_SIZE)
  ) {
    data.body = '';
  }
}

function isUnzipJs(r) {
  r = r.headers;
  return !r['content-encoding'] && util.getContentType(r) === 'JS';
}

function getEventName(proxy) {
  if (util.listenerCount(proxy, '_request')) {
    return '_request';
  } else if (util.listenerCount(proxy, 'httpRequest')) {
    return 'httpRequest';
  }
}

function emitDataEvents(req, res, proxy) {
  var now = Date.now();
  var eventName = getEventName(proxy);
  eventName && proxy.emit(eventName, req.fullUrl);
  if (
    !util.showPluginReq(req) ||
    !config.captureData ||
    (req._filters.hide && !req.disable.hide)
  ) {
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
    useH2: req.isH2,
    isPR: req.isPluginReq ? 1 : undefined,
    _clientId: req._clientId,
    startTime: now,
    id: req.reqId,
    sniPlugin: req.sniPlugin,
    url: req.fullUrl,
    req: reqData,
    res: resData,
    rules: req.rules,
    fwdHost: req._fwdHost,
    pipe: req._pipeRule,
    rulesHeaders: req.rulesHeaders,
    abort: function (clear) {
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
  var isStream;
  var updateEvent;
  var useReqStream;
  var useFrames;
  var enable = req.enable;
  var disable = req.disable;
  var useBigData =
    (enable.bigData || enable.largeData) &&
    !disable.bigData &&
    !disable.largeData;
  var setEndTime = function () {
    if (data.requestTime || !requestTime) {
      data.endTime = endTime || Date.now();
      data.requestTime = data.requestTime || data.endTime;
    } else if (endTime == null) {
      endTime = endTime || Date.now();
    }
  };
  var updateVersion = function () {
    if (req.useH2 != null) {
      data.useH2 = req.useH2;
    }
    data.httpsTime = req.httpsTime;
    data.useHttp = req.useHttp;
    if (data.useH2 && !req.useHttp) {
      reqData.httpVersion = '2.0';
    } else {
      reqData.httpVersion = '1.1';
    }
  };
  var setUnzipSize = function (body, obj) {
    var len = body ? body.length : -1;
    if (len >= 0 && len !== obj.size) {
      obj.unzipSize = len;
    }
  };
  req.setServerPort = function (serverPort) {
    req.serverPort = serverPort;
    setReqStatus(LOCALHOST);
    resData.port = serverPort;
  };
  req.setClientId = function (clientId) {
    data.clientId = clientId;
  };
  res.setCurTrailers = function (trailers, rawTrailerNames) {
    resData.trailers = trailers;
    resData.rawTrailerNames = rawTrailerNames;
  };
  var reqDone, resDone;

  var handleReqBody = function (stream, info) {
    if (reqDone) {
      return;
    }
    reqDone = true;
    info =
      info || (req._needGunzip ? { method: req.method, headers: '' } : req);
    if (!cleared && util.hasRequestBody(info)) {
      reqBody = null;
    }
    reqData.size = 0;
    var write = stream.write;
    var end = stream.end;
    var MAX_REQ_BODY = useBigData
      ? BIG_DATA_SIZE
      : info.headers && info.headers['content-encoding']
      ? MAX_SIZE
      : MAX_REQ_BODY_SIZE;
    stream.write = function (chunk) {
      if (chunk) {
        if (reqBody || reqBody === null) {
          if (useFrames) {
            reqBody = '';
          } else {
            reqBody = reqBody ? Buffer.concat([reqBody, chunk]) : chunk;
            if (useReqStream) {
              reqData.body = reqBody;
            }
            if (reqBody.length > MAX_REQ_BODY) {
              reqBody = false;
            }
          }
        }
        reqData.size += chunk.length;
      }
      updateEvent && proxy.emit(updateEvent, req.fullUrl, false);
      return write.apply(this, arguments);
    };
    stream.end = function (chunk) {
      reqData.size += getChunkLen(chunk);
      requestTime = Date.now();
      if (useFrames) {
        reqBody = '';
      }
      unzipBody(info, reqBody, function (err, body) {
        data.requestTime = requestTime;
        if (endTime) {
          data.endTime = endTime;
        }
        reqBody = err ? util.getErrorStack(err) : body;
        reqData.body = reqBody;
        setUnzipSize(body, reqData);
        checkBodySize(reqData, useBigData);
      });
      updateEvent && proxy.emit(updateEvent, req.fullUrl, false, true);
      return end.apply(this, arguments);
    };
  };
  var handleResBody = function (stream, info) {
    if (resDone) {
      return;
    }
    resDone = true;
    info =
      info ||
      (res._needGunzip ? { statusCode: res.statusCode, headers: '' } : res);
    var useStream = isStream && !getZipType(info);
    var MAX_RES_BODY = useBigData
      ? BIG_DATA_SIZE
      : isUnzipJs(info)
      ? MAX_RES_BODY_SIZE
      : MAX_SIZE;
    if (!cleared && util.hasBody(info, req) && checkType(info)) {
      if (info.headers['content-length'] > MAX_RES_BODY) {
        resBody = false;
      } else {
        resBody = null;
      }
    }
    resData.size = 0;
    var write = stream.write;
    var end = stream.end;
    stream.write = function (chunk) {
      if (chunk) {
        if (resBody || resBody === null) {
          if (useFrames) {
            resBody = '';
          } else {
            resBody = resBody ? Buffer.concat([resBody, chunk]) : chunk;
            if (useStream) {
              resData.body = resBody;
            }
            if (resBody.length > MAX_RES_BODY) {
              resBody = false;
            }
          }
        }
        resData.size += chunk.length;
      }
      updateEvent && proxy.emit(updateEvent, req.fullUrl, true);
      return write.apply(this, arguments);
    };
    stream.end = function (chunk) {
      resData.size += getChunkLen(chunk);
      endTime = Date.now();
      delete data.abort;
      if (useFrames) {
        resBody = '';
      }
      resData.hasGzipError = unzipBody(info, resBody, function (err, body) {
        if (!data.resError) {
          resBody = err ? util.getErrorStack(err) : body;
          resData.body = resBody;
        }
        setUnzipSize(body, resData);
        checkBodySize(resData, useBigData);
        setEndTime();
        reqEmitter.emit('end', data);
      });
      updateEvent && proxy.emit(updateEvent, req.fullUrl, true, true);
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

  req.once('dest', function (_req) {
    _req.once('finish', function () {
      if (!requestTime) {
        data.requestTime = Date.now();
      }
    });
    setReqStatus();
    reqEmitter.emit('send', data);
    !hasReqPipe && handleReqBody(_req, req);
  });
  res.once('src', function (r) {
    _res = r;
    data.pipe = req._pipeRule;
    resData.rawHeaderNames = res.rawHeaderNames;
    if (!data.endTime) {
      setResStatus();
      reqEmitter.emit('response', data);
    }
    !hasResPipe && handleResBody(res, _res);
  });
  req.once('error', handleError);
  res.once('error', handleError);
  res.once('close', handleError);
  res.once('finish', setEndTime);

  function handleError(err) {
    req._hasError = true;
    if (endTime || data.endTime || (data.responseTime && !err)) {
      return;
    }
    !endTime && setEndTime();
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
      } else if (!resData.body) {
        resData.body = 'aborted';
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

  req.initCustomParser = function () {
    if (req.customParser) {
      data.useFrames = false;
      socketMgr.setPending(req);
      req.disableCustomParser = function () {
        data.useFrames = null;
        req.customParser = null;
        req.enableCustomParser = null;
        req.disableCustomParser = null;
        socketMgr.removePending(req);
        delete req.headers['x-whistle-frame-parser'];
      };
      req.enableCustomParser = function (svrRes) {
        useFrames = true;
        reqData.body = '';
        resData.body = '';
        reqData.base64 = '';
        resData.base64 = '';
        data.useFrames = true;
        socketMgr.setContext(
          req,
          svrRes,
          eventName,
          { data: [] },
          { data: [] }
        );
        socketMgr.removePending(req);
        delete req.headers['x-whistle-frame-parser'];
      };
    }
  };

  function setResStatus(defaultCode) {
    if (data.responseTime) {
      return;
    }
    setReqStatus(LOCALHOST);
    resData.statusCode = _res.statusCode || defaultCode || 502;
    resData.statusMessage = _res.statusMessage;
    data.responseTime = Date.now();
    if (!requestTime && !data.requestTime) {
      isStream = true;
      data.isStream = true;
      updateEvent = eventName;
      useReqStream = !getZipType(req);
    }
    if (useReqStream && reqBody) {
      reqData.body = reqBody;
    }
    resData.headers = _res.headers;
  }
}

module.exports = function (req, res, next) {
  emitDataEvents(req, res, this);
  util.delay(util.getMatcherValue(req.rules.reqDelay), function () {
    if (!req.disable.abort && (req._filters.abort || req.enable.abort)) {
      return res.destroy();
    }
    next();
  });
};
