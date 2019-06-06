var rules = require('../rules');
var util = require('../util');
var pluginMgr = require('../plugins');
var fileMgr = require('../util/file-mgr');
var getRawHeaderNames = require('hparser').getRawHeaderNames;

var HTTP_RE = /^https?:/;
var MAX_PAYLOAD_SIZE = 1024 * 256;

function resolveRules(req, callback, rules) {
  if (!rules) {
    return callback();
  }
  req.curUrl = req.fullUrl = util.getFullUrl(req);
  if (rules.initRules) {
    rules.initRules(req);
  } else {
    req.rules = rules.resolveRules(req);
  }
  var urlParamsRule = req.rules.urlParams;
  util.parseRuleJson(urlParamsRule, function(urlParams) {
    if (urlParams) {
      var _url = util.replaceUrlQueryString(req.url, urlParams);
      if (req.url !== _url) {
        req.url = _url;
        req.curUrl = req.fullUrl = util.getFullUrl(req);
        req.rules = rules.resolveRules(req);
        req.rules.urlParams = urlParamsRule;
        if (req.headerRulesMgr) {
          var _rules = req.rules;
          req.rules = req.headerRulesMgr.resolveRules(req);
          util.mergeRules(req, _rules);
        }
      }
    }
    callback();
  });
}

function setupRules(req, next) {
  resolveRules(req, function() {
    var _rules = req.rules;
    rules.resolveRulesFile(req, function() {
      pluginMgr.resolveWhistlePlugins(req);
      pluginMgr.getRules(req, function(pluginRules) {
        req.pluginRules = pluginRules;
        resolveRules(req, function() {
          if (pluginRules) {
            // 插件不支持rulesFile协议
            delete req.rules.rulesFile;
            var _pluginRules = req.rules;
            req.rules = _rules;
            util.mergeRules(req, _pluginRules);
          }

          var ruleUrl = util.rule.getUrl(req.rules.rule);
          if (ruleUrl !== req.fullUrl && HTTP_RE.test(ruleUrl)) {
            ruleUrl = util.encodeNonLatin1Char(ruleUrl);
          }
          req.options = util.parseUrl(ruleUrl || req.fullUrl);
          var rawNames = req.rawHeaderNames = Array.isArray(req.rawHeaders) ?
            getRawHeaderNames(req.rawHeaders) : {};
          rawNames.connection = rawNames.connection || 'Connection';
          rawNames['proxy-authorization'] = rawNames['proxy-authorization'] || 'Proxy-Authorization';
          next();
        }, pluginRules);
      });
    });
  }, rules);
}

function isEnable(req, type) {
  var enable = req && req.enable;
  return enable && enable[type || 'gzip'];
}

function pipeStream(src, target) {
  if (!src || !target) {
    return src || target;
  }
  var pipe = src.pipe;
  src._originalPipePromise = target._originalPipePromise;
  src.pipe = function(stream) {
    pipe.call(src, target);
    target.pipe.apply(target, arguments);
    return stream;
  };
  return src;
}

function hasBody(obj, req) {
  return req ? util.hasBody(obj) : util.hasRequestBody(obj);
}

function getDecoder(obj, req) {
  return function(socket, callback) {
    var encoding = obj._originEncoding;
    var unGzip;
    if (isEnable(req, 'ungzip') || isEnable(req, 'gunzip')) {
      unGzip = 'gzip';
    } else if (socket || encoding !== obj.headers['content-encoding'] || isEnable(req)) {
      obj._hasZipBody = true;
      delete obj.headers['content-length'];
    }
    encoding = unGzip || (obj._hasZipBody && encoding);
    var decoder = encoding && hasBody(obj, req) && util.getUnzipStream(encoding);
    callback(pipeStream(decoder, socket));
  };
}

function getEncoder(obj, req) {
  return function(socket, callback) {
    var type = obj._hasZipBody && obj.headers;
    if (isEnable(req)) {
      type = 'gzip';
    }
    var encoder = type && hasBody(obj, req) && util.getZipStream(type);
    callback(pipeStream(socket, encoder));
  };
}

module.exports = function(req, res, next) {
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
  pluginMgr.resolvePipePlugin(req, function() {
    var reqReadPort = req._pipePluginPorts.reqReadPort;
    if (reqReadPort || req._pipePluginPorts.reqWritePort) {
      delete req.headers['content-length'];
    }
    var hasBodyFilter = rules.resolveBodyFilter(req);
    if (hasBodyFilter || reqReadPort) {
      req._hasZipBody = true;
      req.getPayload(function (err, payload) {
        req._reqBody = fileMgr.decode(payload);
        setupRules(req, next);
      }, hasBodyFilter ? MAX_PAYLOAD_SIZE : 1);
    } else {
      setupRules(req, next);
    }
  });
};

