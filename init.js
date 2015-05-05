var path = require('path');
var fs = require('fs');
var util = require('./util'); //必须第一个加载
var proxy = require('./lib');
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
	var app = proxy(options.port, options.plugins);
	require('util')._extend(app, config);
	
	try {
		require(app.uipath || './biz/webui/app')(app);
		util.installTianma(app);
		require('./biz/weinre/app')(app);
	} catch(e) {
		console.log(e);
	}
	return app;
}

function updateConfig(options) {
	if (options.plugins) {
		options.plugins = options.plugins.split(',').map(function(plugin) {
			return /[^\w-]/i.test(plugin) ? path.resolve(plugin.trim()) : plugin;
		});
	}
	
	for (var i in argvs) {
		config[i] = options[i] || config[i];
	} 
	
	var port = config.port;
	if (Array.isArray(config.ports)) {
		config.ports.forEach(function(name) {
			config[name] = ++port;
		});
	}
}

module.exports = function init(options) {
	options = options || {};
	updateConfig(options);
	parseHosts(options.hosts);
	return start(options);
};