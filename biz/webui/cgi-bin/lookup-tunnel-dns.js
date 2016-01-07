var url = require('url');
var rules = require('../lib/proxy').rules;
var util = require('../lib/util');

module.exports = function(req, res) {
	var tunnelUrl = req.query.url;
	if (typeof tunnelUrl != 'string') {
		tunnelUrl = null;
	} else if (tunnelUrl) {
		tunnelUrl = url.parse(tunnelUrl);
		tunnelUrl = tunnelUrl.host ? 'https://' + tunnelUrl.host : null;
	}
	
	if (!tunnelUrl) {
		return res.json({ec: 2, em: 'server busy'});
	}
	var _rules = rules.resolveRules(tunnelUrl);
	var proxyUrl = util.rule.getProxy(_rules.rule);
	if (proxyUrl) {
		tunnelUrl = 'https:' + util.removeProtocol(proxyUrl);
	} else if (_rules.rule) {
		var _url = util.setProtocol(util.rule.getMatcher(_rules.rule), true);
		if (/^https:/i.test(_url)) {
			tunnelUrl = _url;
		}
	}
	
	rules.resolveHost(tunnelUrl, function(err, host) {
		if (err) {
			res.json({ec: 2, em: 'server busy'});
		} else {
			res.json({ec: 0, em: 'success', host: host});
		}
	});
};