var url = require('url');
var fs = require('fs');
var fse = require('fs-extra');
var qs = require('querystring');
var extend = require('util')._extend;
var path = require('path');
var rules = require('../rules');
var RulesMgr = rules.Rules;
var util = require('../util');
var pluginMgr = require('../plugins');

function getRulesMgr(req, callback) {
	var plugin = pluginMgr.getPluginByRuleUrl(util.rule.getUrl(req.rules.rule));
	if (!plugin) {
		callback();
	}
	
	pluginMgr.loadPlugin(plugin, function(err, ports) {
		if (ports && ports.rulesPort) {
			var options = url.parse(req.fullUrl);
			options.headers = extend({}, req.headers);
			if (options.protocol == 'https:') {
				options.protocol = 'http:';
				options.headers[pluginMgr.SSL_FLAG_HEADER] = 'true';
			}
			options.hostname = null;
			options.host = '127.0.0.1';
			options.port = ports.rulesPort;
			var ruleValue = util.getMatcherValue(req.rules.rule);
			if (ruleValue) {
				options.headers[pluginMgr.RULE_VALUE_HEADER] = encodeURIComponent(ruleValue);
			}
			options.headers = options.headers || req.headers;
			util.getResponseBody(options, function(err, body) {
				if (err || !body) {
					callback(plugin.rulesMgr);
				} else {
					if (body != plugin.__rules) {
						var rulesMgr = new RulesMgr();
						rulesMgr.parse(body + (plugin._rules ? '\n' + plugin._rules : ''), plugin.path);
						plugin._rulesMgr = rulesMgr;
						plugin.__rules = body;
					}
					callback(plugin._rulesMgr);
				}
			});
		} else {
			callback(plugin.rulesMgr);
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
	resolveRules(req, function() {
		req.filter = rules.resolveFilter(req.fullUrl);
		req.disable = rules.resolveDisable(req.fullUrl);
		var _rules = req.rules;
		getRulesMgr(req, function(pluginRules) {
			req.pluginRules = pluginRules;
			resolveRules(req, function() {
				if (pluginRules) {
					extend(req.disable, pluginRules.resolveDisable(req.fullUrl));
					req.rules = extend(_rules, req.rules);
					var filter = extend(req.filter, pluginRules.resolveFilter(req.fullUrl));
					Object.keys(filter).forEach(function(name) {
						_rules[name] = null;
					});
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
				next();
			}, pluginRules);
		});
	}, rules);
};