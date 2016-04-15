var path = require('path');
var os = require('os');
var httpAgent = require('http').Agent;
var httpsAgent = require('https').Agent;
var fse = require('fs-extra');
var pkgConf = require('../package.json');
var config = require('util')._extend(exports, pkgConf);
var now = Date.now();
var variableProperties = ['port', 'sockets', 'timeout', 'dataDirname',
                 		 'username', 'password', 'uipath', 'debug', 'debugMode'];

config.WEINRE_HOST = 'weinre.' + config.localUIHost;
config.ASSESTS_PATH = path.join(__dirname, '../assets');
config.HTTPS_FIELD = 'x-' + config.name + '-https-' + now;
config.CLIENT_IP_HEAD = 'x-forwarded-for-' + config.name + '-' + now;
config.HTTPS_FLAG = config.whistleSsl + '.';

function getWhistlePath() {
	var homedir = typeof os.homedir == 'function' ? os.homedir() : 
					process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'];
	return process.env.WHISTLE_PATH || path.join(homedir, '.WhistleAppData');
}

function getDataDir(dirname) {
	var dir = path.join(getWhistlePath(), dirname || '.' + config.name);
	fse.ensureDirSync(dir);
	return dir;
}

exports.getDataDir = getDataDir;

function createAgent(config, https) {
	return new (https ? httpsAgent : httpAgent)(config)
					.on('free', preventThrowOutError);
}

function preventThrowOutError(socket) {
	socket.removeListener('error', freeSocketErrorListener);
	socket.on('error', freeSocketErrorListener);
}

function freeSocketErrorListener() {
	var socket = this;
	socket.destroy();
	socket.emit('agentRemove');
	socket.removeListener('error', freeSocketErrorListener);
}

function resolvePath(file) {
	if (!file || !(file = file.trim())) {
		return file;
	}
	
	return /^[\w-]+$/.test(file) ? file : path.resolve(file);
}

exports.extend = function extend(newConf) {
	if (newConf) {
		variableProperties.forEach(function(name) {
			config[name] = newConf[name] || pkgConf[name];
		});
		
		if (Array.isArray(newConf.ports)) {
			config.ports = pkgConf.ports.concat(newConf.ports);
		}
		
		if (typeof newConf.middlewares == 'string') {
			config.middlewares = newConf.middlewares.trim().split(/\s*,\s*/g);
		}
	}
	
	config.middlewares = Array.isArray(config.middlewares) ? config.middlewares.map(resolvePath) : [];
	
	var port = config.port;
	config.ports.forEach(function(name) {
		if (!/port$/.test(name) || name == 'port') {
			throw new Error('port name "' + name + '" must be end of "port", but not equals "port", like: ' + name + 'port');
		}
		config[name] = ++port;
	});
	
	var agentConfig = {
			maxSockets: config.sockets, 
			keepAlive: config.keepAlive, 
			keepAliveMsecs: config.keepAliveMsecs
		};
	config.httpAgent = config.debug ? false : createAgent(agentConfig);
	config.httpsAgent = config.debug ? false : createAgent(agentConfig, true);
	config.uipath = config.uipath ? resolvePath(config.uipath) : './webui/app';
	config.DATA_DIR = getDataDir(config.dataDirname);
	
	return config;
};