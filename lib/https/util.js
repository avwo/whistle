var ServerAgent = require('./server-agent');
var cert = require('./cert');

exports.serverAgent = new ServerAgent();

exports.getRootCA = function(callback) {
	cert.getRootCA(callback);
};