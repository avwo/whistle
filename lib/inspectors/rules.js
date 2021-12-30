var PassThrough = require('stream').PassThrough;
var rules = require('../rules');
var util = require('../util');
var pluginMgr = require('../plugins');
var fileMgr = require('../util/file-mgr');
var transproto = require('../util/transproto');
var getEncodeTransform = transproto.getEncodeTransform;
var getDecodeTransform = transproto.getDecodeTransform;
var getRawHeaderNames = require('hparser').getRawHeaderNames;

var HTTP_RE = /^https?:/;
var MAX_PAYLOAD_SIZE = 1024 * 256;

function resolveRules(req, rules) {
  if (!rules) {
    return;
  }
  req.curUrl = req.fullUrl = util.getFullUrl(req);
  if (rules.initRules) {
    rules.initRules(req);
  } else {
    var _pluginRules = rules.resolveReqRules(req);
    // 插件不支持rulesFile协议
    delete req.rules.rulesFile;
    util.mergeRules(req, _pluginRules);
  }
}

function setupRules(req, next) {
  resolveRules(req, rules);
  rules.resolveRulesFile(req, function() {
    pluginMgr.resolveWhistlePlugins(req);
    pluginMgr.getRules(req, function(pluginRules) {
      req.pluginRules = pluginRules;
      resolveRules(req, pluginRules);
      util.filterWeakRule(req);
      var ruleUrl = util.rule.getUrl(req.rules.rule);
      if (ruleUrl !== req.fullUrl && HTTP_RE.test(ruleUrl)) {
        ruleUrl = util.encodeNonLatin1Char(ruleUrl);
      }
      req.options = util.parseUrl(ruleUrl || req.fullUrl);
      if (req.isH2 && ruleUrl && req.options.protocol === 'http:' && ruleUrl !== req.fullUrl) {
        req.isH2 = false;
      }
      var rawNames = req.rawHeaderNames = Array.isArray(req.rawHeaders) ?
        getRawHeaderNames(req.rawHeaders) : {};
      rawNames.connection = rawNames.connection || 'Connection';
      rawNames['proxy-authorization'] = rawNames['proxy-authorization'] || 'Proxy-Authorization';
      next();
    });
  });
}

function getDecoder(obj) {
  return function(socket, callback) {
    var encoding = obj._originEncoding;
    var handleError = function(err) {
      obj.emit('error', err);
    };
    var decoder;
    if (obj._needGunzip || socket || encoding !== obj.headers['content-encoding']) {
      var stream = encoding && (obj._srcResponse || obj);
      util.readOneChunk(stream, function(chunk) {
        obj._needGunzip = false;
        if (chunk) {
          if (chunk[0] === 31 && (chunk[1] == null || chunk[1] === 139)) {
            decoder = util.getUnzipStream(encoding);
            obj._needGunzip = true;
          } else {
            decoder = new PassThrough();
            obj._originEncoding = null;
          }
          decoder.write(chunk);
        }
        handleDecode(stream);
      });
    } else {
      handleDecode();
    }
    function handleDecode(stream) {
      decoder && decoder.on('error', handleError);
      if (socket) {
        delete obj.headers['content-length'];
        var enTrans = getEncodeTransform();
        var deTrans = getDecodeTransform();
        enTrans.pipe(socket).pipe(deTrans);
        enTrans.on('error', handleError);
        deTrans.on('error', handleError);
        if (decoder) {
          decoder.pipe(enTrans);
        } else {
          decoder = enTrans;
        }
        socket = deTrans;
      }
      callback(decoder, socket, stream);
    }
  };
}

function getEncoder(obj, req) {
  return function(socket, callback) {
    var encoding;
    var enable = req && req.enable;
    if (enable && enable.gzip && (obj._needGunzip || !obj._originEncoding)) {
      encoding = 'gzip';
    } else {
      encoding = obj._needGunzip && obj.headers;
    }
    var encoder = encoding && util.getZipStream(encoding);
    var handleError = function(err) {
      obj.emit('error', err);
    };
    encoder && encoder.on('error', handleError);
    if (socket) {
      delete obj.headers['content-length'];
      var enTrans = getEncodeTransform();
      var deTrans = getDecodeTransform();
      enTrans.on('error', handleError);
      deTrans.on('error', handleError);
      enTrans.pipe(socket).pipe(deTrans);
      socket = enTrans;
      if (encoder) {
        deTrans.pipe(encoder);
      } else {
        encoder = deTrans;
      }
      socket.pipe = function(stream) {
        return encoder.pipe(stream);
      };
      obj.emit('bodyStreamReady', socket);
    }
    callback(socket || encoder);
  };
}

module.exports = function(req, res, next) {
  if (req.isLogRequests !== false) {
    ++util.proc.httpRequests;
    ++util.proc.totalHttpRequests;
    req.isLogRequests = true;
  }
  req.reqId = util.getReqId();
  req.curUrl = req.fullUrl = util.getFullUrl(req);
  req._originEncoding = req.headers['content-encoding'];
  req.onDecode = function(callback) {
    var decode = getDecoder(req);
    pluginMgr.getReqReadPipe(req, function(socket) {
      decode(socket, callback);
    });
  };
  req.onEncode = function(callback) {
    var encode = getEncoder(req);
    pluginMgr.getReqWritePipe(req, function(socket) {
      encode(socket, callback);
    });
  };
  res.onDecode = function(callback) {
    var decode = getDecoder(res, req);
    pluginMgr.getResReadPipe(req, res, function(socket) {
      decode(socket, callback);
    });
  };
  res.onEncode = function(callback) {
    var encode = getEncoder(res, req);
    pluginMgr.getResWritePipe(req, res, function(socket) {
      encode(socket, callback);
    });

  };
  rules.initHeaderRules(req, true);
  pluginMgr.resolvePipePlugin(req, function() {
    var reqReadPort = req._pipePluginPorts.reqReadPort;
    if (reqReadPort || req._pipePluginPorts.reqWritePort) {
      delete req.headers['content-length'];
    }
    var hasBodyFilter = rules.resolveBodyFilter(req);
    req._bodyFilters = null;
    if (hasBodyFilter || reqReadPort) {
      req._needGunzip = true;
      var payloadSize = MAX_PAYLOAD_SIZE;
      if (!hasBodyFilter) {
        payloadSize = rules.hasReqScript(req) ? 0 : 1;
      }
      req.getPayload(function (err, payload) {
        req._reqBody = fileMgr.decode(payload);
        setupRules(req, next);
      }, payloadSize);
    } else {
      setupRules(req, next);
    }
  });
};

