var url = require('url');
var fs = require('fs');
var fse = require('fs-extra');
var qs = require('querystring');
var extend = require('util')._extend;
var path = require('path');
var rules = require('../rules');
var util = require('../util');
var pluginMgr = require('../plugins');
var index = 0;

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
		pluginMgr.getRules(req, function(pluginRules) {
			req.pluginRules = pluginRules;
			resolveRules(req, function() {
				if (pluginRules) {
					extend(req.rules, _rules);
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
				next();
			}, pluginRules);
		});
	}, rules);
};