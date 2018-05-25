var serverAgent = require('hagent').serverAgent;
var ca = require('./ca');

serverAgent.createCertificate = ca.createCertificate;
exports.serverAgent = serverAgent;
exports.getDomain = ca.getDomain;
exports.hasCustomCert = ca.hasCustomCert;
exports.getRootCAFile = ca.getRootCAFile;
