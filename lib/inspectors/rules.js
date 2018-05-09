var fs = require('fs');
var fse = require('fs-extra2');
var qs = require('querystring');
var rules = require('../rules');
var util = require('../util');
var pluginMgr = require('../plugins');
var getRawHeaderNames = require('hparser').getRawHeaderNames;

var HTTP_RE = /^https?:/;

function resolveRules(req, callback, rules) {
  if (!rules) {
    return callback();
  }
  var fullUrl = req.fullUrl = util.getFullUrl(req);
  if (rules.initRules) {
    rules.initRules(req);
  } else {
    req.rules = rules.resolveRules(fullUrl);
  }
  util.parseRuleJson(req.rules.urlParams, function(urlParams) {
    if (urlParams) {
      var _url = util.replaceUrlQueryString(req.url, urlParams);
      if (req.url !== _url) {
        req.url = _url;
        fullUrl = req.fullUrl = util.getFullUrl(req);
        req.rules = rules.resolveRules(fullUrl);
        if (req.headerRulesMgr) {
          var _rules = req.rules;
          req.rules = req.headerRulesMgr.resolveRules(req.fullUrl);
          util.mergeRules(req, _rules);
        }
      }
    }

    util.getRuleValue(req.rules.dispatch, function(dispatchScript) {
      if (typeof dispatchScript == 'string' && (dispatchScript = dispatchScript.trim())) {
        var qMarkIndex = fullUrl.indexOf('?');
        var params = {};
        var query;
        if (qMarkIndex != -1 && (query = fullUrl.substring(qMarkIndex + 1))) {
          params = qs.parse(query);
        }

        var ip = req.clientIp;
        var context = {
          url: fullUrl,
          method: util.toUpperCase(req.method) || 'GET',
          httpVersion: req.httpVersion || '1.1',
          isLocalAddress: function(_ip) {
            return util.isLocalAddress(_ip || ip);
          },
          ip: ip,
          isWhistleHttps: req.isWhistleHttps,
          headers: util.clone(req.headers),
          params: params
        };
        if (util.execScriptSync(dispatchScript, context)) {
          var _url = util.replaceUrlQueryString(req.url, context.params);
          if (_url != req.url) {
            req.url = _url;
            fullUrl = req.fullUrl = util.getFullUrl(req);
            req.rules = rules.resolveRules(fullUrl);
          }
        }
      }

      callback();
    });
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

          var exportsFile = util.getMatcherValue(req.rules.exportsUrl);
          if (exportsFile) {
            exportsFile = util.join(req.rules.exportsUrl.root, exportsFile);
            fse.ensureFile(exportsFile, function(err) {
              if (err) {
                return;
              }

              fs.writeFile(exportsFile, '\r\n' + req.fullUrl, {flag: 'a'}, util.noop);
            });
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

