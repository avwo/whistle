var serverAgent = require('E:/workbench/workspace/github/hagent').serverAgent;
var ca = require('./ca');

serverAgent.createCertificate = ca.createCertificate;
exports.serverAgent = serverAgent;

exports.getRootCAFile = ca.getRootCAFile;
