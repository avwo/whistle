var path = require('path');
var util = require('../../../../util');
var CAPTURE_DATA_PATH = path.join(util.LOCAL_DATA_PATH, 'captureData');
var URLS_DATA_PATH = path.join(CAPTURE_DATA_PATH, 'urls');
var HEADERS_DATA_PATH = path.join(CAPTURE_DATA_PATH, 'headers');
var BODIES_DATA_PATH = path.join(CAPTURE_DATA_PATH, 'bodies');

function handleRequest(request) {
	
}

function handleTunnel(request) {
	
}

function handleTunnelProxy(request) {
	
}

function mkdir(util) {
	
}

module.exports = function(proxy) {
	proxy.on('request', handleRequest);
	proxy.on('tunnel', handleTunnel);
	proxy.on('tunnelProxy', handleRequest);
};

