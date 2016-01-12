var url = require('url');
var fs = require('fs');
var fse = require('fs-extra');
var rules = require('../rules');
var util = require('../util');

module.exports = function(req, res, next) {
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	req.rules = rules.resolveRules(fullUrl);
	util.parseRuleJson(req.rules.urlParams, function(urlParams) {
		util.getRuleValue(req.rules.dispatch, function(dispatchScript) {
			if (urlParams) {
				req.url = util.replaceUrlQueryString(req.url, urlParams);
				fullUrl = req.fullUrl = util.getFullUrl(req);
				req.rules = rules.resolveRules(fullUrl);
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