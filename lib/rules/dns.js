var dns = require('dns');
var updateQueue = [];
var dnsCache = {};
var callbacks = {};
var reqCount = 12;
var TIMEOUT = 6000;

function lookupDNS(hostname, callback) {
	var list = callbacks[hostname];
	if (list) {
		list.push(callback);
		return;
	}
	callbacks[hostname] = list = [callback];
	
	var done;
	function execCallback(err, ip) {
		if (!err) {
			var host = dnsCache[hostname] = {
					ip: ip,
					hostname: hostname
			};
			addUpdateQueue(host);
		}
		
		if (done) {
			return;
		}
		done = true;
		delete callbacks[hostname];
		list.forEach(function(callback) {
			callback(err, ip);
		});
	}
	
	var timeout = setTimeout(function() {
		execCallback(new Error('timeout'));
	}, TIMEOUT);
	
	try {
		dns.lookup(hostname, function (err, ip, type) {
			clearTimeout(timeout);
			err ? execCallback(err) : 
				execCallback(null, ip || (!type || type == 4 ? '127.0.0.1' : '0:0:0:0:0:0:0:1'));
		  });
	} catch(err) {//如果断网，可能直接抛异常，https代理没有用到error-handler
		execCallback(err);
	}
}

function addUpdateQueue(host) {
	updateQueue.unshift(host);
	if (reqCount <= 0) {
		return;
	}
	--reqCount;
	updateHost();
}

function updateHost() {
	var host = updateQueue.pop();
	setTimeout(function() {
		lookupDNS(host.hostname, function(err, ip) {
			updateQueue.unshift(host);
			updateHost();
			if (!err) {
				host.ip = ip;
			}
		});
	}, TIMEOUT);
}

module.exports = function lookup(hostname, callback, allowDnsCache) {
	var host = allowDnsCache ? dnsCache[hostname] : null;
	return host ? callback(null, host.ip) 
			: lookupDNS(hostname, callback);
};