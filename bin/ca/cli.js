var os = require('os');
var path = require('path');
var installRootCA = require('./index');

var rootFile = path.join(os.homedir(), '.WhistleAppData/.whistle/certs/root.crt');
installRootCA(rootFile);
