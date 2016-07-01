var os = require('os');
var config = require('../lib/config');
var properties = require('../lib/properties');

exports.getServerInfo = function getServerInfo(req) {
	var info = {
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
	var ifaces = os.networkInterfaces();
	Object.keys(ifaces).forEach(function(ifname) {
		 ifaces[ifname].forEach(function (iface) {
			    if (iface.internal) {
			      return;
			    }
			    info[iface.family == 'IPv4' ? 'ipv4' : 'ipv6'].push(iface.address);
			  });
	});
	
	return info;
};

