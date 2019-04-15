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

function getDecoder(obj) {
  return function(callback) {
    var encoding = obj._originEncoding;
    var newEncoding = obj.headers['content-encoding'];
    if (encoding !== newEncoding) {
      obj._hasZipBody = true;
      encoding = encoding || newEncoding;
      delete obj.headers['content-length'];
    }
    callback(obj._hasZipBody && encoding && util.getUnzipStream(encoding));
  };
}

function getEncoder(obj) {
  return function(callback) {
    callback(obj._hasZipBody && util.getZipStream(obj.headers));
  };
}

module.exports = function(req, res, next) {
  req.reqId = util.getReqId();
  req.curUrl = req.fullUrl = util.getFullUrl(req);
  req._originEncoding = req.headers['content-encoding'];
  req.onDecode = getDecoder(req);
  req.onEncode = getEncoder(req);
  res.onDecode = getDecoder(res);
  res.onEncode = getEncoder(res);
  if (rules.resolveBodyFilter(req)) {
    req._hasZipBody = true;
    req.getPayload(function (err, payload) {
      req._reqBody = fileMgr.decode(payload);
      setupRules(req, next);
    }, MAX_PAYLOAD_SIZE);
  } else {
    setupRules(req, next);
  }
};

