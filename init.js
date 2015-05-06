var path = require('path');
var fs = require('fs');
var config = require('./util').config; //位置不能变
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

function start(options) {
	var app = proxy(options.port, options.plugins);
	extend(app, config);
	require('./biz/init')(app);
	return app;
}

module.exports = function init(options) {
	extend(config, options);
	parseHosts(options.rules);
	return start(options);
};