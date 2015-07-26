var os = require('os');

exports.getServerInfo = function getServerInfo() {
	var info = {
			host: os.hostname(),
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

