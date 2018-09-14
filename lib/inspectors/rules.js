var rules = require('../rules');
var util = require('../util');
var pluginMgr = require('../plugins');
var getRawHeaderNames = require('hparser').getRawHeaderNames;

var HTTP_RE = /^https?:/;

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
  util.parseRuleJson(req.rules.urlParams, function(urlParams) {
    if (urlParams) {
      var _url = util.replaceUrlQueryString(req.url, urlParams);
      if (req.url !== _url) {
        req.url = _url;
        req.curUrl = req.fullUrl = util.getFullUrl(req);
        req.rules = rules.resolveRules(req);
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

module.exports = function(req, res, next) {
  req.reqId = util.getReqId();
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
            ruleUrl = util.encodeNonAsciiChar(ruleUrl);
          }
          req.options = util.parseUrl(ruleUrl || req.fullUrl);
          req.rawHeaderNames = Array.isArray(req.rawHeaders) ?
            getRawHeaderNames(req.rawHeaders) : {};
          if (!req.rawHeaderNames.connection) {
            req.rawHeaderNames.connection = 'Connection';
          }
          next();
        }, pluginRules);
      });
    });
  }, rules);
};

