var ServerAgent = require('./server-agent');
var ca = require('./ca');

exports.serverAgent = new ServerAgent();

exports.getRootCAFile = ca.getRootCAFile;