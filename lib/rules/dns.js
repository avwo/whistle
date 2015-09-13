var dns = require('dns');
var updateQueue = [];
var dnsCache = {};
var callbacks = {};
var reqCount = 10;
var fastReqCount = 20;
var fastUpdateCount = 30;
var TIMEOUT = 6000;
var UPDATE_INTERVAL = 1000;

function lookupDNS(hostname, callback) {
	var list = callbacks[hostname];
	if (list) {
		list.push(callback);
		return;
	}
	callbacks[hostname] = list = [callback];
	
	var done;
	function execCallback(err, ip) {
		var host;
		if (err) {
			host = dnsCache[hostname];
		} else {
			host = dnsCache[hostname] = {
					ip: ip,
					hostname: hostname,
					time: Date.now()
			};
		}
		addUpdateQueue(host);
		
		if (done) {
			return;
		}
		done = true;
		callbacks[hostname] = null;
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

function addUpdateQueue(host, fast) {
	if (!host) {
		return;
	}
	updateQueue[fast ? 'push' : 'unshift'](host);
	if (reqCount <= 0) {
		return;
	}
	
	--reqCount;
	if (fast) {
		updateQueue.pop();
		updateHost(host);
	} else {
		setTimeout(function() {
			var host = updateQueue.pop();
			if (host) {
				updateHost(host);
			} else {
				++reqCount;
			}
		}, UPDATE_INTERVAL);
	}
}

function updateHost(host, fast) {
	lookupDNS(host.hostname, function(err, ip) {
		if (fast) {
			++fastReqCount;
		} else {
			++reqCount;
		}
	});
}

function fastUpdateHost(host) {
	if (Date.now() - host.time < TIMEOUT) {
		return;
	}
	
	var index = updateQueue.indexOf(host);
	if (index == -1) {
		return;
	}
	updateQueue.splice(index, 1);
	if (fastReqCount <= 0) {
		addUpdateQueue(host, true);
	} else {
		--fastReqCount;
		updateHost(host, true);
	}
}

module.exports = function lookup(hostname, callback, allowDnsCache) {
	var host = allowDnsCache ? dnsCache[hostname] : null;
	if (host) {
		callback(null, host.ip);
		fastUpdateHost(host);
	} else {
		lookupDNS(hostname, callback);
	}
};