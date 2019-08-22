var forge = require('node-forge');
var fs = require('fs');
var net = require('net');
var path = require('path');
var crypto = require('crypto');
var LRU = require('lru-cache');
var tls = require('tls');
var hagent = require('hagent');
var extend = require('extend');
var https = require('https');
var pki = forge.pki;
var createSecureContext = require('tls').createSecureContext || crypto.createCredentials;
var config = require('../config');

var CUR_VERSION = process.version;
var requiredVersion = parseInt(CUR_VERSION.slice(1), 10) >= 6;
var HTTPS_DIR = mkdir(path.join(config.getDataDir(), 'certs'));
var ROOT_NEW_KEY_FILE = path.join(HTTPS_DIR, 'root_new.key');
var ROOT_NEW_CRT_FILE = path.join(HTTPS_DIR, 'root_new.crt');
var CUSTOM_CERTS_DIR = config.CUSTOM_CERTS_DIR;
var useNewKey = fs.existsSync(ROOT_NEW_KEY_FILE) && fs.existsSync(ROOT_NEW_CRT_FILE);
var ROOT_KEY_FILE = useNewKey ? ROOT_NEW_KEY_FILE : path.join(HTTPS_DIR, 'root.key');
var ROOT_CRT_FILE = useNewKey ? ROOT_NEW_CRT_FILE : path.join(HTTPS_DIR, 'root.crt');
var customCertDir = config.certDir;
var customPairs = {};
var customCertsInfo = {};
var customCertCount = 0;
var cachePairs = new LRU({max: 5120});
var serverCache = new LRU({max: 1024});
var ILEGAL_CHAR_RE = /[^a-z\d-]/i;
var RANDOM_SERIAL = '.' + Date.now() + '.' + Math.floor(Math.random() * 10000);
var PORT_RE = /:\d*$/;
var hasCustomRoot;
var ROOT_KEY, ROOT_CRT;

if (!useNewKey && requiredVersion && !checkCertificate()) {
  try {
    fs.unlinkSync(ROOT_KEY_FILE);
    fs.unlinkSync(ROOT_CRT_FILE);
  } catch(e) {}
}

function mkdir(path) {
  !fs.existsSync(path) && fs.mkdirSync(path);
  return path;
}

function checkCertificate() {
  try {
    var crt = pki.certificateFromPem(fs.readFileSync(ROOT_CRT_FILE));
    if (crt.publicKey.n.toString(2).length < 2048) {
      return false;
    }
    return /^whistle\.\d+$/.test(getCommonName(crt));
  } catch(e) {}
  return true;
}

function getCommonName(crt) {
  var attrs = crt.issuer && crt.issuer.attributes;
  if (Array.isArray(attrs)) {
    for (var i = 0, len = attrs.length; i < len; i++) {
      var attr = attrs[i];
      if (attr && attr.name === 'commonName') {
        return attr.value;
      }
    }
  }
  return '';
}

function getDomain(hostname) {
  if (getCertificate(hostname) || net.isIP(hostname)) {
    return hostname;
  }
  var list = hostname.split('.');
  var prefix = list[0];
  list[0] = '*';
  var wildDomain = list.join('.');
  if (getCertificate(wildDomain)) {
    return wildDomain;
  }
  var len = list.length;
  if (len < 3) {
    return hostname;
  }
  if (len > 3 || ILEGAL_CHAR_RE.test(prefix) || list[1].length > 3
    || list[2] === 'com' || list[1] === 'url') { // For tencent cdn
    return wildDomain;
  }

  return hostname;
}

exports.getDomain = getDomain;
exports.existsCustomCert = function(hostname) {
  if (!customCertCount) {
    return false;
  }
  hostname = hostname.replace(PORT_RE, '');
  var cert = customPairs[hostname];
  if (cert) {
    return true;
  }
  hostname = hostname.split('.');
  hostname[0] = '*';
  return customPairs[hostname.join('.')];
};

function getCertificate(hostname) {
  return customPairs[hostname] || cachePairs.get(hostname);
}

function createCertificate(hostname) {
  var cert = getCertificate(hostname);
  if (cert) {
    return cert;
  }

  var serialNumber = crypto.createHash('sha1')
    .update(hostname + RANDOM_SERIAL, 'binary').digest('hex');
  cert = createCert(pki.setRsaPublicKey(ROOT_KEY.n, ROOT_KEY.e), serialNumber, true);

  cert.setSubject([{
    name: 'commonName',
    value: hostname
  }]);

  cert.setIssuer(ROOT_CRT.subject.attributes);
  cert.setExtensions([ {
    name: 'subjectAltName',
    altNames: [net.isIP(hostname) ?
      {
        type: 7,
        ip: hostname
      } : {
        type: 2,
        value: hostname
      }]
  } ]);
  cert.sign(ROOT_KEY, forge.md.sha256.create());
  cert = {
    key: pki.privateKeyToPem(ROOT_KEY),
    cert: pki.certificateToPem(cert)
  };
  cachePairs.set(hostname, cert);
  return cert;
}

function loadCustomCerts(certDir) {
  if (!certDir) {
    return;
  }
  var certs = {};
  try {
    fs.readdirSync(certDir).forEach(function(name) {
      if (!/^(.+)\.(crt|key)$/.test(name)) {
        return;
      }
      var filename =RegExp.$1;
      var suffix = RegExp.$2;
      var cert = certs[filename] = certs[filename] || {};
      if (suffix === 'crt') {
        suffix = 'cert';
      }
      try {
        var filePath = path.join(certDir, name);
        cert[suffix] = fs.readFileSync(filePath, {encoding: 'utf8'});
        var mtime = fs.statSync(filePath).mtime.getTime();
        if (cert.mtime == null || cert.mtime < mtime) {
          cert.mtime = mtime;
        }
      } catch(e) {}
    });
  } catch(e) {}
  var rootCA = certs.root;
  delete certs.root;
  if (rootCA && rootCA.key && rootCA.cert && !hasCustomRoot) {
    hasCustomRoot = true;
    ROOT_KEY_FILE = path.join(certDir, 'root.key');
    ROOT_CRT_FILE = path.join(certDir, 'root.crt');
  }
  var keys = Object.keys(certs).filter(function(key) {
    var cert = certs[key];
    return cert && cert.mtime != null;
  }).sort(function(key1, key2) {
    return certs[key1].mtime > certs[key2].mtime ? -1 : 1;
  });
  keys.forEach(function(filename) {
    var cert = certs[filename];
    if (!cert || !cert.key || !cert.cert) {
      return;
    }
    try {
      var pem = pki.certificateFromPem(cert.cert);
      var altNames = getAltNames(pem.extensions);
      var mtime = cert.mtime;
      var validity = pem.validity;
      altNames.forEach(function(item) {
        if ((item.type === 2 || item.type === 7) && !customPairs[item.value]) {
          customPairs[item.value] = cert;
          customCertsInfo[item.value] = extend({ filename: filename, mtime: mtime, domain: item.value }, validity);
        }
      });
    } catch (e) {}
  });
  customCertCount = Object.keys(customPairs).length;
}

function getAltNames(exts) {
  for (var i = 0, len = exts.length; i < len; i++) {
    var item = exts[i];
    if (item.name === 'subjectAltName') {
      return item.altNames;
    }
  }
}

function createRootCA() {
  loadCustomCerts(customCertDir);
  loadCustomCerts(CUSTOM_CERTS_DIR);
  if (ROOT_KEY && ROOT_CRT) {
    return;
  }
  var rootKey, rootCrt;
  try {
    ROOT_KEY = fs.readFileSync(ROOT_KEY_FILE);
    ROOT_CRT = fs.readFileSync(ROOT_CRT_FILE);
    rootKey = ROOT_KEY;
    rootCrt = ROOT_CRT;
  } catch (e) {
    ROOT_KEY = ROOT_CRT = null;
  }

  if (ROOT_KEY && ROOT_CRT && ROOT_KEY.length && ROOT_CRT.length) {
    ROOT_KEY = pki.privateKeyFromPem(ROOT_KEY);
    ROOT_CRT = pki.certificateFromPem(ROOT_CRT);
  } else {
    var cert = createCACert();
    ROOT_CRT = cert.cert;
    ROOT_KEY = cert.key;
    rootKey = pki.privateKeyToPem(ROOT_KEY);
    rootCrt = pki.certificateToPem(ROOT_CRT);
    fs.writeFileSync(ROOT_KEY_FILE, rootKey.toString());
    fs.writeFileSync(ROOT_CRT_FILE, rootCrt.toString());
  }
}

function getRandom() {
  var random = Math.floor(Math.random() * 1000);
  if (random < 10) {
    return '00' + random;
  }
  if (random < 100) {
    return '0' + random;
  }
  return '' + random;
}

function createCACert() {
  var keys = pki.rsa.generateKeyPair(requiredVersion ? 2048 : 1024);
  var cert = createCert(keys.publicKey);
  var now = Date.now() + getRandom();
  var attrs = [ {
    name : 'commonName',
    value : 'whistle.' + now
  }, {
    name : 'countryName',
    value : 'CN'
  }, {
    shortName : 'ST',
    value : 'ZJ'
  }, {
    name : 'localityName',
    value : 'HZ'
  }, {
    name : 'organizationName',
    value : now + '.wproxy.org'
  }, {
    shortName : 'OU',
    value : 'wproxy.org'
  } ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([ {
    name : 'basicConstraints',
    cA : true
  }, {
    name : 'keyUsage',
    keyCertSign : true,
    digitalSignature : true,
    nonRepudiation : true,
    keyEncipherment : true,
    dataEncipherment : true
  }, {
    name : 'extKeyUsage',
    serverAuth : true,
    clientAuth : true,
    codeSigning : true,
    emailProtection : true,
    timeStamping : true
  }, {
    name : 'nsCertType',
    client : true,
    server : true,
    email : true,
    objsign : true,
    sslCA : true,
    emailCA : true,
    objCA : true
  } ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    key: keys.privateKey,
    cert: cert
  };
}

function createCert(publicKey, serialNumber, isShortPeriod) {
  var cert = pki.createCertificate();
  cert.publicKey = publicKey;
  cert.serialNumber = serialNumber || '01';
  var curYear = new Date().getFullYear();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notBefore.setFullYear(curYear - 1);
  // https://chromium.googlesource.com/chromium/src/+/refs/heads/master/net/cert/cert_verify_proc.cc#900
  cert.validity.notAfter.setFullYear(curYear + (isShortPeriod ? 1 : 10));
  return cert;
}

function getRootCAFile() {
  return ROOT_CRT_FILE;
}

createRootCA();// 启动生成ca

hagent.serverAgent.createCertificate = createCertificate;
var createHttpsServer = function(options, listener) {
  var server = https.createServer(options);
  if (typeof listener === 'function') {
    server.on('request', listener);
  } else if (listener) {
    Object.keys(listener).forEach(function(name) {
      server.on(name, listener[name]);
    });
  }
  return server;
};
var getHttpsServer = hagent.create(createHttpsServer, 43900);
var callbacks = [];
var TIMEOUT = 6000;
var sniPort;

var SNICallback = function(serverName, cb) {
  serverName = getDomain(serverName);
  var options = createCertificate(serverName);
  if (!options._ctx) {
    options._ctx = createSecureContext(options);
  }
  cb(null, options._ctx);
};

var removeServer = function() {
  sniPort = null;
  try {
    this.close();
  } catch(e) {} //重复关闭会导致异常
};

exports.createServer =  function(serverName, listener) {
  serverName = getDomain(serverName);
  var server = serverCache.get(serverName);
  if (!server) {
    var options = createCertificate(serverName);
    server = tls.createServer(createSecureContext(options), listener);
    serverCache.set(serverName, server);
  }
  return server;
};
exports.getCustomCertsInfo = function() {
  return customCertsInfo;
};
exports.getRootCAFile = getRootCAFile;
exports.createCertificate = createCertificate;
exports.serverAgent = hagent.serverAgent;

var SNI_OPTIONS = { SNICallback: SNICallback };
exports.SNI_OPTIONS = SNI_OPTIONS;
exports.getSNIServer = function(listener, callback) {
  if (sniPort) {
    return callback(sniPort);
  }
  getHttpsServer(SNI_OPTIONS, listener, function(server, port) {
    server.on('error', removeServer);
    var timeout = setTimeout(removeServer, TIMEOUT);
    var clearup = function() {
      clearTimeout(timeout);
    };
    server.once('tlsClientError', clearup);
    server.once('secureConnection', clearup);
    sniPort = port;
    callbacks.forEach(function(cb) {
      cb(sniPort);
    });
  });
};
