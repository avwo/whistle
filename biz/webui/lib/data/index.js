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

module.exports = function(proxy) {
	util.mkdir(CAPTURE_DATA_PATH);
	util.mkdir(URLS_DATA_PATH);
	util.mkdir(HEADERS_DATA_PATH);
	util.mkdir(BODIES_DATA_PATH);
	proxy.on('request', handleRequest);
	proxy.on('tunnel', handleTunnel);
	proxy.on('tunnelProxy', handleRequest);
};

