var path = require('path');
var fs = require('fs');
var proxy = require('./lib/proxy');
var util = require('./util');
var config = util.config;
var argvs = util.argvs;
var rulesUtil = require('./lib/rules/util');
var tianma = require('./biz/tianma/app');

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
	tianma(app);
	try {
		require(app.uipath || config.webui)(app);
	} catch(e) {}
	return app;
}

module.exports = function init(options) {
	options = options || {};
	parseHosts(options.hosts);
	return start(options);
};