var cp = require('child_process');
var exec = cp.exec;
var spawn = cp.spawn;
var path = require("path");
var fs = require("fs");
var util = require('../util');
var CERT_CACHE_DIR = path.join(util.LOCAL_DATA_PATH, 'certs');
var CERT_DIR = path.join(__dirname, '../assets/cert');
var isWin = process.platform == 'win32';
var DEFAULT_KEY = fs.readFileSync(path.join(__dirname, '../assets/cert/default.key'));
var DEFAULT_CRT = fs.readFileSync(path.join(__dirname, '../assets/cert/default.crt'));
var HOSTNAME_RE = /xx/;

util.mkdir(CERT_CACHE_DIR);

function getCert(hostname,callback){
	if (!hostname) {
		return callback(DEFAULT_KEY, DEFAULT_CRT);
	}
	
	var keyFile = path.join(CERT_CACHE_DIR , hostname + '.key');
	var crtFile = path.join(CERT_CACHE_DIR , hostname + '.crt');
	
	fs.exists(keyFile, function(exits) {
		if (!exits) {
			createCert(hostname, callback);
			return;
		}
		fs.exists(crtFile, function(exits) {
			if (!exits) {
				createCert(hostname, callback);
				return;
			}
			execCallback(null, keyFile, crtFile);
		});
	});
	
	function createCert(hostname,callback){
		execCallback(new Error('not install openssl.'));
	}
	
	function execCallback(err, keyFile, crtFile) {
		if (err) {
			return callback(DEFAULT_KEY, DEFAULT_CRT);
		}
		
		fs.readFile(keyFile, function(err, keyCtn) {
			keyCtn = keyCtn || DEFAULT_KEY;
			fs.readFile(crtFile, function(err, crtCtn) {
				crtCtn = crtCtn || DEFAULT_CRT;
				callback(keyCtn, crtCtn);
			});
		});
	}
}


function getRootCA(callback) {
	
}

function clear() {
	
}

exports.getRootCA = getRootCA;
exports.getCert = getCert;
exports.clear = clear;
exports.getDefault = function() {
	
	return [DEFAULT_KEY, DEFAULT_CRT];
};
