var os = require('os');
var config = require('../lib/config');

exports.getServerInfo = function getServerInfo() {
	var info = {
			version: config.version,
			host: os.hostname(),
			port: config.port,
			ipv4: [],
			ipv6: []
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

