var serverAgent = require('hagent').serverAgent;
var ca = require('./ca');

serverAgent.createCertificate = ca.createCertificate;
exports.serverAgent = serverAgent;
exports.getDomain = ca.getDomain;
exports.getRootCAFile = ca.getRootCAFile;
