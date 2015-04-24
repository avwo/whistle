var path = require('path');
var fs = require('fs');
var proxy = require('./lib');
var util = require('./util');
var config = util.config;
var argvs = util.argvs;
var rulesUtil = require('./lib/rules/util');

function parseHosts(hostsPath) {
	if (hostsPath) {
		try {
			rulesUtil.setPublicHosts(fs.readFileSync(path.resolve(hostsPath), {encoding: 'utf8'}));
		} catch(e) {}
	}
	
	rulesUtil.loadHosts();
}

function start(options) {
	if (options.plugins) {
		options.plugins = options.plugins.split(',').map(function(plugin) {
			return path.resolve(plugin.trim());
		});
	}
	var app = proxy(options.port, options.plugins);
	for (var i in argvs) {
		app[i] = options[i] || config[i];
	}
	
	try {
		require(app.uipath || './biz/webui/app')(app);
		util.installTianma();
	} catch(e) {}
	return app;
}

module.exports = function init(options) {
	options = options || {};
	parseHosts(options.hosts);
	return start(options);
};