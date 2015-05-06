var path = require('path');
var fs = require('fs');
var extend = require('util')._extend;
var proxy = require('./lib');
var rulesUtil = require('./lib/rules/util');

function parseHosts(rulesPath) {
	if (rulesPath) {
		try {
			rulesUtil.setPublicHosts(fs.readFileSync(path.resolve(rulesPath), {encoding: 'utf8'}));
			rulesUtil.enablePublicHosts();
		} catch(e) {}
	}
	
	rulesUtil.loadHosts();
}

function start(config) {
	var app = proxy(config.port, config.plugins);
	extend(app, config);
	require('./biz/init')(app);
	return app;
}

module.exports = function init(config) {
	parseHosts(config.rules);
	return start(config);
};