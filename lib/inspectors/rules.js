var url = require('url');
var fs = require('fs');
var fse = require('fs-extra');
var qs = require('querystring');
var rules = require('../rules');
var util = require('../util');

module.exports = function(req, res, next) {
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
			req.filter = rules.resolveFilter(fullUrl);
			req.disable = rules.resolveDisable(fullUrl);
			req.options = url.parse(util.rule.getUrl(req.rules.rule) || fullUrl);
			var exportsFile = util.getMatcherValue(req.rules.exportsUrl);
			if (exportsFile) {
				fse.ensureFile(exportsFile, function(err) {
					if (err) {
						return;
					}
					
					fs.writeFile(exportsFile, '\r\n' + fullUrl, {flag: 'a'}, util.noop);
				});
			}
			next();
		});
	});
};