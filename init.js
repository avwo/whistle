var path = require('path');
var fs = require('fs');
var extend = require('util')._extend;
var util = require('./util'); //必须第一个加载
var proxy = require('./lib');
var config = util.config;
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
	require('util')._extend(app, config);
	require('./biz/init')(app);
	return app;
}

module.exports = function init(options) {
	extend(config, options);
	parseHosts(options.rules);
	return start(options);
};