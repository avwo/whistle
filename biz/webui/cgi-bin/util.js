var os = require('os');
var config = require('../lib/config');
var properties = require('../lib/properties');

exports.getServerInfo = function getServerInfo(req) {
	
	return {
		version: config.version,
		nodeVersion: process.version,
		latestVersion: properties.get('latestVersion'),
		host: os.hostname(),
		port: config.port,
		weinrePort: config.weinreport,
		ipv4: [],
		ipv6: [],
		mac: req.ip
	};
};

