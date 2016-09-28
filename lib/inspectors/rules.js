var url = require('url');
var fs = require('fs');
var fse = require('fs-extra');
var qs = require('querystring');
var extend = require('util')._extend;
var path = require('path');
var Pac = require('node-pac');
var rules = require('../rules');
var util = require('../util');
var pluginMgr = require('../plugins');
var parseRule = rules.Rules.parseRule;
var index = 0;
var cachedPacs = {};
var pacCount = 0;

function findProxyFromPac(req, next) {
  var rules = req.rules;
  var pacUrl = util.getMatcherValue(rules.pac);
  if (rules.rule || rules.host || !pacUrl) {
    return next();
  }
  if (!pacUrl) {
    return next();
  }
  var pac = cachedPacs[pacUrl];
  if (pac) {
    delete cachedPacs[pacUrl];
    cachedPacs[pacUrl] = pac;
  } else {
    pacCount++;
    var list = Object.keys(cachedPacs);
    if (list.length >= 10) {
      pacCount--;
      delete cachedPacs[list[0]];
    }
    cachedPacs[pacUrl] = pac = new Pac(pacUrl);
  }
  return pac.findWhistleProxyForURL(req.fullUrl, function(err, rule) {
    if (rule) {
      rules.rule = parseRule(rules.pac.rawPattern, rule);
      next();
    }
  });
}

function resolveRules(req, callback, rules) {
	if (!rules) {
		return callback();
	}
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	util.parseRuleJson(req.rules.urlParams, function(urlParams) {
		if (urlParams) {
			req.url = util.replaceUrlQueryString(req.url, urlParams);
			fullUrl = req.fullUrl = util.getFullUrl(req);
			req.rules = rules.resolveRules(fullUrl);
		}
		
		util.getRuleValue(req.rules.dispatch, function(dispatchScript) {
			if (typeof dispatchScript == 'string' && (dispatchScript = dispatchScript.trim())) {
				var qMarkIndex = fullUrl.indexOf('?');
				var params = {};
				var query;
				if (qMarkIndex != -1 && (query = fullUrl.substring(qMarkIndex + 1))) {
					params = qs.parse(query);
				}
				
				var ip = util.getClientIp(req) || '127.0.0.1';
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
	req.reqId = ++index;
	resolveRules(req, function() {
		req.filter = rules.resolveFilter(req.fullUrl);
		req.disable = rules.resolveDisable(req.fullUrl);
		var _rules = req.rules; 
		pluginMgr.resolvePluginRule(req);
		pluginMgr.getRules(req, function(pluginRules) {
			req.pluginRules = pluginRules;
			resolveRules(req, function() {
				if (pluginRules) {
					req.rules = extend(_rules, req.rules);
					util.handlePluginRules(req, pluginRules);
				}
				req.options = url.parse(util.rule.getUrl(req.rules.rule) || req.fullUrl);
				var exportsFile = util.getMatcherValue(req.rules.exportsUrl);
				if (exportsFile) {
					var root = req.rules.exportsUrl.root;
					if (root) {
						exportsFile = path.join(root, exportsFile);
					}
					fse.ensureFile(exportsFile, function(err) {
						if (err) {
							return;
						}
						
						fs.writeFile(exportsFile, '\r\n' + req.fullUrl, {flag: 'a'}, util.noop);
					});
				}
				findProxyFromPac(req, next);
			}, pluginRules);
		});
	}, rules);
};