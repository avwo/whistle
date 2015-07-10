var cp = require('child_process');
var exec = cp.exec;
var spawn = cp.spawn;
var path = require("path");
var fs = require("fs");
var util = require('../../util');
var HTTPS_DIR = path.join(util.LOCAL_DATA_PATH, 'https');
var RELATIVE_CERTS_DIR = 'certs/';
var CERTS_DIR = path.join(HTTPS_DIR, RELATIVE_CERTS_DIR);
var DEFAULT_CERT_DIR = path.join(__dirname, '../../assets/cert');
var spawn = require('child_process').spawn;
var path = require('path');
var SUBJ = '/C=ZH/ST=ZJ/L=HZ/O=webtools/OU=whistle/CN=whistlejs.com/emailAddress=avenwu@vip.qq.com';
var CWD = {cwd: HTTPS_DIR};
var isWin = process.platform == 'win32';
var createSecureContext = require('tls').createSecureContext || require('crypto').createCredentials;
var DEFAULT_CERT = exports.DEFAULT_CERT = [fs.readFileSync(path.join(__dirname, '../../assets/cert/default.key')), 
                    fs.readFileSync(path.join(__dirname, '../../assets/cert/default.crt'))];
var DEFAULT_CERT_CTX = exports.DEFAULT_CERT_CTX = createSecureContext({
	key: DEFAULT_CERT[0],
	cert: DEFAULT_CERT[1]
});
var ROOT_KEY_PATH = path.join(HTTPS_DIR, 'root.key');
var ROOT_CRT_PATH = path.join(HTTPS_DIR, 'root.crt');
var HOSTNAME_RE = /^[.\-\w]+$/;
var existsRootCA;
var cache = {};
var callbacks = {};
var createCACallbacks = [];

util.mkdir(HTTPS_DIR);
util.mkdir(CERTS_DIR);

function getCert(hostname){
	
	return cache[hostname] || DEFAULT_CERT_CTX;
}

function createCert(hostname, callback) {
	if (!HOSTNAME_RE.test(hostname) || cache[hostname]) {
		return callback();
	}
	var list = callbacks[hostname];
	if (!list) {
		list = [callback];
	} else {
		list.push(callback);
	}
	
	var keyFile = path.join(CERTS_DIR, hostname + '.key');
	var crtFile = path.join(CERTS_DIR, hostname + '.crt');
	var execCallback = function(err, keyBuffer, crtBuffer) {
		if (!err) {
			cache[hostname] = createSecureContext({
				key: keyBuffer,
				cert: crtBuffer
			});
		}
		
		list.forEach(function(callback) {
			callback(err);
		});
		delete callbacks[hostname];
	};
	
	fs.readFile(keyFile, function(err, keyBuffer) {
		err ? createCAAndCert(hostname, execCallback) : 
			fs.readFile(crtFile, function(err, crtBuffer) {
				err ? createCAAndCert(hostname, execCallback) : callback(null, keyBuffer, crtBuffer);
			});
	});
	
}

function createCAAndCert(hostname, callback) {
	if (!HOSTNAME_RE.test(hostname)) {
		return callback(new Error('Invalid hostname.'));
	}
	
	getRootCA(function(err) {
		err ? callback(err) : _createCert(hostname, callback);
	});
}

function _createCert(hostname, callback) {
	var key =  RELATIVE_CERTS_DIR + hostname + '.key';
	var csr = RELATIVE_CERTS_DIR + hostname + '.csr';
	execAll(['genrsa -passout pass:whistle -out ' + key + ' 2048',
	         'rsa -in ' + key + ' -passin pass:whistle -out ' + key,
	         'req -new -key ' + key + ' -out ' + csr + ' -passin pass:whistle -subj ' + SUBJ.replace('whistlejs.com', hostname),
	         'x509 -req -days 3650 -in ' + csr + ' -CA root.crt -CAkey root.key -CAcreateserial -out ' + hostname + '.crt'], callback);
}

function getRootCA(callback) {
	hasRootCA(function(exists) {
		exists ? callback(null, ROOT_KEY_PATH, ROOT_CRT_PATH) : 
			creatRootCA(function(err) {
				err ? callback(err) : callback(null, ROOT_KEY_PATH, ROOT_CRT_PATH);
			});
	});
}

function clear() {
	cache = {};
	fs.readdir(CERTS_DIR, function(err, files) {
		files && files.forEach(function(file) {
			fs.unlink(path.join(CERTS_DIR, file), util.noop);
		});
	});
}

function creatRootCA(callback) {
	if (!createCACallbacks) {
		return callback();
	}
	if (createCACallbacks.length) {
		return createCACallbacks.push(callback);
	}
	
	createCACallbacks.push(callback);
	execAll(['genrsa -out root.key 2048',
	         'req -x509 -new -nodes -key root.key -days 3650 -out root.crt -subj ' + SUBJ], function(err) {
		createCACallbacks.forEach(function(callback) {
			callback(err);
		});
		existsRootCA = !err;
		createCACallbacks = err ? [] : null;
	});
}

function hasRootCA(callback) {
	if (existsRootCA) {
		return callback(true);
	}
	fs.exists(path.join(ROOT_KEY_PATH), function(exists) {
		exists ? fs.exists(path.join(ROOT_CRT_PATH), function(exists) {
			existsRootCA = exists;
			callback(exists);
		}) : callback(false);
	});
}

function execAll(args, callback) {
	
	args.length ? exec(args.shift(), function(err) {
		err ? callback(err) : execAll(args, callback);
	}) : callback();
}

function exec(args, callback) {
	  if (typeof args == 'string') {
	  args = args.trim().split(/\s/g);
	  }
	  
	  var err;
	  var openssl = spawn('openssl', args, CWD);
	
	  openssl.on('error', function(e) {
		  err = e;
	  }).on('close', function(code) {
		  callback(err, code);
	  }).stdin.end();
};


exports.getRootCA = getRootCA;
exports.createCert = createCert;
exports.getCert = getCert;
exports.clear = clear;
