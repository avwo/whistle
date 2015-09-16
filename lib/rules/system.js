var os = require('os');
var fs = require('fs');
var HOSTS_MAP = {
		darwin: '/private/etc/hosts', 
		win32:'C:/Windows/system32/drivers/etc/hosts'
};
var hostsFilePath = HOSTS_MAP[os.platform()] || '/etc/hosts';

function getHosts(callback) {
	fs.readFile(hostsFilePath, {encoding: 'utf8'}, callback);
}

function setHosts(hosts, callback) {
	fs.writeFile(hostsFilePath, hosts || '', callback);
}

function getProxy() {
	
}

function setProxy(ip, port) {
	
}

function resetProxy() {
	
}

module.exports = {
		getHosts: getHosts,
		setHosts: setHosts,
		getProxy: getProxy,
		setProxy: setProxy,
		resetProxy: resetProxy
};

