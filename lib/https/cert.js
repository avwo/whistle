var fs = require('fs');
var path = require('path');
var Q = require('q');
var util = require('../../util');
var HTTPS_DIR = path.join(util.LOCAL_DATA_PATH, 'https');
var RELATIVE_CERTS_DIR = 'certs/';
var CERTS_DIR = path.join(HTTPS_DIR, RELATIVE_CERTS_DIR);
var DEFAULT_CERT_DIR = path.join(__dirname, '../../assets/cert');
var spawn = require('child_process').spawn;

var isWin = process.platform == 'win32';
var createSecureContext = require('tls').createSecureContext || require('crypto').createCredentials;
var DEFAULT_CERT = exports.DEFAULT_CERT = [fs.readFileSync(path.join(__dirname, '../../assets/cert/default.key')), 
                    fs.readFileSync(path.join(__dirname, '../../assets/cert/default.crt'))];
var DEFAULT_CERT_CTX = exports.DEFAULT_CERT_CTX = createSecureContext({
	key: DEFAULT_CERT[0],
	cert: DEFAULT_CERT[1]
});
var SUBJ = '/C=ZH/ST=ZJ/L=HZ/O=TOOLS/OU=PROXY/CN=WHISTLE/emailAddress=avenwu@vip.qq.com';
var CWD = {cwd: HTTPS_DIR, detached: true};
var ROOT_KEY_PATH = path.join(HTTPS_DIR, 'root.key');
var ROOT_CRT_PATH = path.join(HTTPS_DIR, 'root.crt');
var HOSTNAME_RE = /^[.\-\w]+$/;
var CREATE_TIMEOUT = 16000;

var existsRootCA, rootCAPromise;
var cache = {};
var callbacks = {};

util.mkdir(HTTPS_DIR);
util.mkdir(CERTS_DIR);

function getCert(hostname){
	hostname = cache[hostname];
	return hostname && hostname.cert || DEFAULT_CERT;
}

function getCertContext(hostname) {
	hostname = cache[hostname];
	return hostname && hostname.context || DEFAULT_CERT_CTX;
}

function createCert(hostname, callback) {
	if (!HOSTNAME_RE.test(hostname) || cache[hostname]) {
		return callback();
	}
	
	var promise = callbacks[hostname];
	var defer;
	
	if (!promise) {
		defer = Q.defer();
		promise = callbacks[hostname] = defer.promise;
	}
	
	promise.done(callback, callback);
	
	if (!defer) {
		return;
	}
	
	
	var keyFile = path.join(CERTS_DIR, hostname + '.key');
	var crtFile = path.join(CERTS_DIR, hostname + '.crt');
	
	readCertFromDisk(keyFile, crtFile, function(err, keyBuffer, crtBuffer) {
		if (err) {
			createRootCAAndCert(hostname, function(err) {
				if (err) {
					return error(err);
				}
				 readCertFromDisk(keyFile, crtFile, function(err, keyBuffer, crtBuffer) {
						err ? error(err) : success(keyBuffer, crtBuffer);
				 });
			});
			
			return;
		}
		
		success(keyBuffer, crtBuffer);
	});
	
	function success(keyBuffer, crtBuffer) {
		delete callbacks[hostname];
		cache[hostname] = {
				context: createSecureContext({
							key: keyBuffer,
							cert: crtBuffer
				}),
				cert: [keyBuffer, crtBuffer]
		};
		defer.resolve();
	}
	
	function error(err) {
		delete callbacks[hostname];
		defer.reject(err);
	}
	
}

function createRootCAAndCert(hostname, callback) {
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
	var crt = 'certs/' + hostname + '.crt';
	execAll(['genrsa -passout pass:whistle -out ' + key + ' 2048',
	         'rsa -in ' + key + ' -passin pass:whistle -out ' + key,
	         'req -new -key ' + key + ' -out ' + csr + ' -passin pass:whistle -subj ' + SUBJ.replace('WHISTLE', hostname),
	         'x509 -req -days 3650 -in ' + csr + ' -CA root.crt -CAkey root.key -CAcreateserial -out ' + crt], callback);
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
	var defer;
	if (!rootCAPromise) {
		defer = Q.defer();
		rootCAPromise = defer.promise;
	}
	
	rootCAPromise.done(callback, callback);
	if (!defer) {
		return rootCAPromise;
	}
	
	execAll(['genrsa -out root.key 2048',
	         'req -x509 -new -nodes -key root.key -days 3650 -out root.crt -subj ' + SUBJ], function(err) {
		if (err) {
			rootCAPromise = null;
			defer.reject(err);
		} else {
			existsRootCA = true;
			defer.resolve();
		}
	});
}

function hasRootCA(callback) {
	if (existsRootCA) {
		return callback(true);
	}
	
	readCertFromDisk(path.join(ROOT_KEY_PATH), path.join(ROOT_CRT_PATH), 
			function(err) {
		callback(existsRootCA = !err);
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
	  
	  var done, timeout;
	  var openssl = spawn('openssl', args, CWD);
	
	  function execCallback(err, code) {
		  if (!done) {
			  clearTimeout(timeout);
			  done = true;
			  callback(err, code);
		  }
	  }
	  
	  timeout = setTimeout(function() {
		  try {
			  openssl.stdout.destroy();
			  openssl.stderr.destroy();
			  openssl.kill('SIGTERM');
		  } catch (e) {}
		  execCallback(new Error('timeout'));
	  }, CREATE_TIMEOUT);
	  
	  openssl.on('error', function(err) {
		  execCallback(err);
	  }).on('close', function(code) {
		  execCallback(null, code);
	  }).stdin.end();
	  openssl.unref();
}

function readCertFromDisk(keyFile, crtFile, callback) {
	fs.readFile(keyFile, function(err, keyBuffer) {
		if (!err && !(keyBuffer&& keyBuffer.length)) {
			err = new Error('unkonw');
		}
		
		if (err) {
			callback(err);
			return;
		}
		
		fs.readFile(crtFile, function(err, crtBuffer) {
			if (!err && !(crtBuffer && crtBuffer.length)) {
				err =  new Error('unkonw');
			}
			
			if (err) {
				callback(err);
				return;
			}
			callback(null, keyBuffer, crtBuffer);
		});
	});
}


exports.getRootCA = getRootCA;
exports.createCert = createCert;
exports.getCert = getCert;
exports.getCertContext = getCertContext;
exports.clear = clear;
