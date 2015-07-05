var cp = require('child_process');
var exec = cp.exec;
var spawn = cp.spawn;
var path = require("path");
var fs = require("fs");
var util = require('../util');
var CERT_CACHE_DIR = path.join(util.LOCAL_DATA_PATH, 'certs');
var CERT_DIR = path.join(__dirname, '../assets/cert');
var isWin = process.platform == 'win32';
var createSecureContext = require('tls').createSecureContext || require('crypto').createCredentials;
var DEFAULT_CERT = [fs.readFileSync(path.join(__dirname, '../assets/cert/default.key')), 
                    fs.readFileSync(path.join(__dirname, '../assets/cert/default.crt'))];
var DEFAULT_CERT_CTX = createSecureContext({
	key: DEFAULT_CERT[0],
	cert: DEFAULT_CERT[1]
});
var cache = {};
var HOSTNAME_RE = /xx/;

util.mkdir(CERT_CACHE_DIR);

function getCert(hostname){
	
	return cache[hostname] || DEFAULT_CERT_CTX;
}

function createCert(hostname, callback) {
	
	if (!hostname) {
		return callback(null, DEFAULT_CERT_CTX);
	}
	
	if  (cache[hostname]) {
		return callback(null, cache[hostname]);
	}
	
	
	callback(new Error('not implemented'));
}

function getDefault() {
	
	return DEFAULT_CERT;
}

function getRootCA(callback) {
	
}

function remove(hostname) {
	delete cache[hostname];
	removeCertFiles(hostname);
}

function clear(hosts) {
	if (!hosts) {
		cache = {};
	} else {
		hosts.forEach(function(hostname) {
			delete cache[hostname];
		});
	}
	
	removeCertFiles(hosts);
}

function removeCertFiles() {
	
}

exports.getRootCA = getRootCA;
exports.createCert = createCert;
exports.getCert = getCert;
exports.remove = remove;
exports.clear = clear;
exports.getDefault = getDefault;
