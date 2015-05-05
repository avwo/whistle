

function handleRequest(request) {
	
}

function handleTunnel(request) {
	
}

function handleTunnelProxy(request) {
	
}

module.exports = function(proxy) {
	proxy.on('request', handleRequest);
	proxy.on('tunnel', handleTunnel);
	proxy.on('tunnelProxy', handleRequest);
};

