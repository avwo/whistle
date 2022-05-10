var forge = require('node-forge');
var fs = require('fs');
var net = require('net');
var path = require('path');
var crypto = require('crypto');
var LRU = require('lru-cache');
var hagent = require('hagent');
var extend = require('extend');
var h2 = require('./h2');
var createSecureContext =
  require('tls').createSecureContext || crypto.createCredentials;
var util = require('../util');
var config = require('../config');

var pki = forge.pki;
var workerIndex = util.workerIndex;
var CUR_VERSION = process.version;
var requiredVersion = parseInt(CUR_VERSION.slice(1), 10) >= 6;
var HTTPS_DIR = mkdir(path.join(config.getDataDir(), 'certs'));
var ROOT_NEW_KEY_FILE = path.join(HTTPS_DIR, 'root_new.key');
var ROOT_NEW_CRT_FILE = path.join(HTTPS_DIR, 'root_new.crt');
var CUSTOM_CERTS_DIR = config.disableCustomCerts
  ? null
  : config.CUSTOM_CERTS_DIR;
var useNewKey =
  fs.existsSync(ROOT_NEW_KEY_FILE) && fs.existsSync(ROOT_NEW_CRT_FILE);
var ROOT_KEY_FILE = useNewKey
  ? ROOT_NEW_KEY_FILE
  : path.join(HTTPS_DIR, 'root.key');
var ROOT_CRT_FILE = useNewKey
  ? ROOT_NEW_CRT_FILE
  : path.join(HTTPS_DIR, 'root.crt');
var customCertDir = config.certDir;
var customPairs = {};
var customCertsInfo = {};
var customCertsFiles = {};
var allCustomCerts = {};
var customCertCount = 0;
var cachePairs = new LRU({ max: 5120 });
var certsCache = new LRU({ max: 256 });
var remoteCerts = new LRU({ max: 1280 });
var ILEGAL_CHAR_RE = /[^a-z\d-]/i;
var RANDOM_SERIAL = '.' + Date.now() + '.' + Math.floor(Math.random() * 10000);
var CLEAR_CERTS_INTERVAL = 1000 * 60 * 60 * 24 * 20;
var MAX_INNTERFAL = 18;
var PORT_RE = /:\d*$/;
var customRoot;
var ROOT_KEY, ROOT_CRT;
var rootKey, rootCrt;

exports.remoteCerts = remoteCerts;
exports.createSecureContext = createSecureContext;
exports.CUSTOM_CERTS_DIR = CUSTOM_CERTS_DIR;

// When delay is larger than 2147483647 or less than 1, the delay will be set to 1. Non-integer delays are truncated to an integer.
var intervalCount = 0;
var timer = setInterval(function () {
  if (++intervalCount >= MAX_INNTERFAL) {
    intervalCount = 0;
    cachePairs.reset();
    certsCache.reset();
  }
}, CLEAR_CERTS_INTERVAL);

if (timer && typeof timer.unref === 'function') {
  timer.unref();
}

if (!useNewKey && requiredVersion && !checkCertificate()) {
  try {
    fs.unlinkSync(ROOT_KEY_FILE);
    fs.unlinkSync(ROOT_CRT_FILE);
  } catch (e) {}
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
  } catch (e) {}
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
  if (getCacheCert(hostname) || net.isIP(hostname)) {
    return hostname;
  }
  var list = hostname.split('.');
  var prefix = list[0];
  list[0] = '*';
  var wildDomain = list.join('.');
  if (getCacheCert(wildDomain)) {
    return wildDomain;
  }
  var len = list.length;
  if (len < 3) {
    return hostname;
  }
  if (
    len > 3 ||
    ILEGAL_CHAR_RE.test(prefix) ||
    list[1].length > 3 ||
    list[2] === 'com' ||
    list[1] === 'url'
  ) {
    // For tencent cdn
    return wildDomain;
  }

  return hostname;
}

exports.getDomain = getDomain;
exports.existsCustomCert = function (hostname) {
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

exports.hasCustomCerts = function () {
  return customCertCount;
};

function getCacheCert(hostname) {
  return (
    customPairs[hostname] ||
    cachePairs.get(hostname) ||
    certsCache.get(hostname)
  );
}

var curIndex = 0;
function getIndex() {
  ++curIndex;
  if (curIndex < 10) {
    return '0' + curIndex;
  }
  if (curIndex > 99) {
    curIndex = 0;
    return '00';
  }
  return curIndex;
}

function createSelfCert(hostname) {
  var serialNumber =
    crypto
      .createHash('sha1')
      .update(hostname + RANDOM_SERIAL, 'binary')
      .digest('hex') +
    getIndex() +
    workerIndex;
  var cert = createCert(
    pki.setRsaPublicKey(ROOT_KEY.n, ROOT_KEY.e),
    serialNumber,
    true
  );
  cert.setSubject([
    {
      name: 'commonName',
      value: hostname
    }
  ]);
  cert.setIssuer(ROOT_CRT.subject.attributes);
  cert.setExtensions([
    {
      name: 'subjectAltName',
      altNames: [
        net.isIP(hostname)
          ? {
            type: 7,
            ip: hostname
          }
          : {
            type: 2,
            value: hostname
          }
      ]
    }
  ]);
  cert.sign(ROOT_KEY, forge.md.sha256.create());
  return {
    key: pki.privateKeyToPem(ROOT_KEY),
    cert: pki.certificateToPem(cert)
  };
}

exports.createCertificate = function (hostname) {
  hostname = getDomain(hostname);
  var cert = cachePairs.get(hostname); // 确保使用自己生成的证书，防止把用户证书下载出去
  if (!cert) {
    cert = createSelfCert(hostname);
    certsCache.set(hostname, cert);
  }
  return cert;
};

function parseCert(cert) {
  var pem = pki.certificateFromPem(cert.cert);
  var altNames = getAltNames(pem.extensions);
  if (!altNames || !altNames.length) {
    return;
  }
  return { cert: cert, altNames: altNames, validity: pem.validity };
}

function parseAllCustomCerts() {
  var pairs = {};
  var certsInfo = {};
  var certFiles = {};
  var keys = Object.keys(allCustomCerts).sort(function (key1, key2) {
    return util.compare(
      allCustomCerts[key1].cert.mtime,
      allCustomCerts[key2].cert.mtime
    );
  });
  keys.forEach(function (filename) {
    var info = allCustomCerts[filename];
    var cert = info.cert;
    var mtime = cert.mtime;
    var validity = info.validity;
    var altNames = info.altNames;
    var dnsName = [];
    altNames.forEach(function (item) {
      if ((item.type === 2 || item.type === 7) && !pairs[item.value]) {
        var preCert = customPairs[item.value];
        if (preCert && preCert.key === cert.key && preCert.cert === cert.cert) {
          if (preCert.mtime < mtime) {
            preCert.mtime = mtime;
          }
          pairs[item.value] = preCert;
        } else {
          pairs[item.value] = cert;
        }
        dnsName.push(item.value);
        certsInfo[item.value] = extend(
          { filename: filename, type: cert.type, mtime: mtime, domain: item.value },
          validity
        );
      }
    });
    if (dnsName.length) {
      certFiles[filename] = extend(
        { mtime: mtime, type: cert.type, dir: cert.dir, dnsName: dnsName.join(', ') },
        validity
      );
    }
  });
  certFiles.root = certFiles.root || customCertsFiles.root;
  customPairs = pairs;
  customCertsInfo = certsInfo;
  customCertsFiles = certFiles;
  customCertCount = Object.keys(customPairs).length;
  checkExpired();
}

function loadCustomCerts(certDir, isCustom) {
  if (!certDir) {
    return;
  }
  var certs = {};
  try {
    fs.readdirSync(certDir).forEach(function (name) {
      if (!/^(.+)\.(crt|cer|pem|key)$/.test(name)) {
        return;
      }
      var filename = RegExp.$1;
      var type = RegExp.$2;
      var cert = (certs[filename] = certs[filename] || {});
      var isCert = type !== 'key';
      try {
        var filePath = path.join(certDir, name);
        var mtime = fs.statSync(filePath).mtime.getTime();
        if (isCert && cert.type && (cert.mtime == null || cert.mtime >= mtime)) {
          return;
        }
        cert.dir = certDir;
        if (isCert) {
          cert.mtime = mtime;
          cert.type = type;
          type = 'cert';
        }
        cert[type] = fs.readFileSync(filePath, { encoding: 'utf8' });
      } catch (e) {}
    });
  } catch (e) {}
  var rootCA = certs.root;
  delete certs.root;
  if (rootCA && rootCA.key && rootCA.cert && !customRoot) {
    customRoot = rootCA;
    ROOT_KEY_FILE = path.join(certDir, 'root.key');
    ROOT_CRT_FILE = path.join(certDir, 'root.' + rootCA.type);
  }
  Object.keys(certs).filter(function (key) {
    var cert = certs[key];
    if (cert && cert.mtime != null && cert.key && cert.cert) {
      try {
        cert = parseCert(cert);
        if (cert) {
          allCustomCerts[isCustom ? 'z/' + key : key] = cert;
        }
      } catch (e) {}
    }
  });
}

function getAltNames(exts) {
  for (var i = 0, len = exts.length; i < len; i++) {
    var item = exts[i];
    if (item.name === 'subjectAltName') {
      return Array.isArray(item.altNames) && item.altNames.filter(util.noop);
    }
  }
}

function createRootCA() {
  allCustomCerts = {};
  loadCustomCerts(customCertDir, true);
  loadCustomCerts(CUSTOM_CERTS_DIR);
  parseAllCustomCerts();
  if (ROOT_KEY && ROOT_CRT) {
    return;
  }
  try {
    ROOT_KEY = fs.readFileSync(ROOT_KEY_FILE);
    ROOT_CRT = fs.readFileSync(ROOT_CRT_FILE);
    rootKey = ROOT_KEY.toString();
    rootCrt = ROOT_CRT.toString();
  } catch (e) {
    ROOT_KEY = ROOT_CRT = null;
  }

  if (ROOT_KEY && ROOT_CRT && ROOT_KEY.length && ROOT_CRT.length) {
    ROOT_KEY = pki.privateKeyFromPem(ROOT_KEY);
    ROOT_CRT = pki.certificateFromPem(ROOT_CRT);
    if (customRoot) {
      customCertsFiles.root = extend(
        {
          mtime: customRoot.mtime,
          dir: customRoot.dir,
          type: customRoot.type,
          dnsName: ''
        },
        ROOT_CRT.validity
      );
    }
    try {
      var altNames = getAltNames(ROOT_CRT.extensions);
      var dnsName = [];
      altNames.forEach(function (item) {
        if (
          (item.type === 2 || item.type === 7) &&
          dnsName.indexOf(item.value) === -1
        ) {
          dnsName.push(item.value);
        }
      });
      customCertsFiles.root.dnsName = dnsName.join(', ');
    } catch (e) {}
  } else {
    var cert = createCACert();
    ROOT_CRT = cert.cert;
    ROOT_KEY = cert.key;
    rootKey = pki.privateKeyToPem(ROOT_KEY).toString();
    rootCrt = pki.certificateToPem(ROOT_CRT).toString();
    fs.writeFileSync(ROOT_KEY_FILE, rootKey);
    fs.writeFileSync(ROOT_CRT_FILE, rootCrt);
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

function createCACert(opts) {
  opts = opts || {};
  var keys = pki.rsa.generateKeyPair(requiredVersion ? 2048 : 1024);
  var cert = createCert(keys.publicKey);
  var now = Date.now() + getRandom();
  var attrs = [
    {
      name: 'commonName',
      value: opts.commonname || opts.commonName || 'whistle.' + now
    },
    {
      name: 'countryName',
      value: opts.countryname || opts.countryName || 'CN'
    },
    {
      shortName: 'ST',
      value: opts.st || opts.ST || 'ZJ'
    },
    {
      name: 'localityName',
      value: opts.localityname || opts.localityName || 'HZ'
    },
    {
      name: 'organizationName',
      value: opts.organizationname || opts.organizationName || now + '.wproxy.org'
    },
    {
      shortName: 'OU',
      value: opts.ou || opts.OU || 'wproxy.org'
    }
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true
    },
    {
      name: 'nsCertType',
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true
    }
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    key: keys.privateKey,
    cert: cert
  };
}

exports.createRootCA = function(opts) {
  var cert = createCACert(opts);
  cert.key = pki.privateKeyToPem(cert.key).toString();
  cert.cert = pki.certificateToPem(cert.cert).toString();
  return cert;
};

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

createRootCA(); // 启动生成ca

function getOrCreateCert(servername) {
  var requestCert = servername[0] === ':';
  if (requestCert) {
    servername = servername.substring(1);
  }
  var cert = remoteCerts.get(servername);
  if (!cert) {
    servername = getDomain(servername);
    cert = getCacheCert(servername);
    if (!cert) {
      cert = createSelfCert(servername);
      cachePairs.set(servername, cert);
    }
  }
  return requestCert
    ? extend(
      {
        requestCert: true,
        rejectUnauthorized: false
      },
        cert
      )
    : cert;
}

hagent.serverAgent.createCertificate = getOrCreateCert;
var getHttp2Server = hagent.create(h2.getHttpServer, 42900);
var getHttpsServer = hagent.create(h2.getServer, 43900);
var cbs = {};
var ports = {};
var TIMEOUT = 6000;

var SNICallback = function (servername, cb) {
  var options = getOrCreateCert(servername);
  if (!options._ctx) {
    try {
      options._ctx = createSecureContext(options);
    } catch (e) {}
  }
  cb(null, options._ctx);
};

exports.getRootCA = function () {
  return {
    key: rootKey,
    cert: rootCrt
  };
};

exports.getCustomCertsInfo = function () {
  return customCertsInfo;
};
exports.getCustomCertsFiles = function () {
  return customCertsFiles;
};

exports.getRootCAFile = getRootCAFile;
exports.serverAgent = hagent.serverAgent;

exports.SNICallback = SNICallback;

function addCallback(name, callback) {
  var cbList = cbs[name];
  if (!cbList) {
    cbList = [];
    cbs[name] = cbList;
  }
  cbList.push(callback);
  return cbList;
}

function createServer(name, cbList, listener, options) {
  var removeServer = function () {
    ports[name] = null;
    try {
      this.close();
    } catch (e) {} //重复关闭会导致异常
  };
  ports[name] = false; // pending
  var getServer = options ? getHttpsServer : getHttp2Server;
  getServer(options, listener, function (server, port) {
    server.on('error', removeServer);
    var timeout = setTimeout(removeServer, TIMEOUT);
    var clearup = function () {
      clearTimeout(timeout);
    };
    if (options) {
      server.once('tlsClientError', clearup);
      server.once('secureConnection', clearup);
    } else {
      server.once('connection', clearup);
    }
    ports[name] = port;
    cbList.forEach(function (cb) {
      cb(port);
    });
    cbs[name] = [];
  });
}

exports.getHttp2Server = function (listener, callback) {
  var name = 'httpH2';
  var curPort = ports[name];
  if (curPort) {
    return callback(curPort);
  }
  var cbList = addCallback(name, callback);
  if (curPort === false) {
    return;
  }
  createServer(name, cbList, listener);
};

exports.getSNIServer = function (listener, callback, disableH2, requestCert) {
  var enableH2 = config.enableH2 && !disableH2;
  var name = (enableH2 ? 'h2Sni' : 'sni') + (requestCert ? 'WithCert' : '');
  var curPort = ports[name];
  if (curPort) {
    return callback(curPort);
  }
  var cbList = addCallback(name, callback);
  if (curPort === false) {
    return;
  }
  var options = { SNICallback: SNICallback };
  options.allowHTTP1 = enableH2; // 是否启用http2
  if (requestCert) {
    options = extend(
      {
        requestCert: true,
        rejectUnauthorized: false
      },
      options
    );
  }
  createServer(name, cbList, listener, options);
};

var checkTimer;

function checkExpired() {
  clearTimeout(checkTimer);
  var now = Date.now();
  var files = Object.keys(customCertsFiles);
  exports.hasInvalidCerts = false;
  for (var i = 0, len = files.length; i < len; i++) {
    var file = customCertsFiles[files[i]];
    try {
      var startDate = new Date(file.notBefore);
      var endDate = new Date(file.notAfter);
      if (startDate.getTime() > now) {
        exports.hasInvalidCerts = true;
        return;
      } else if (endDate.getTime() < now) {
        exports.hasInvalidCerts = true;
        return;
      }
    } catch (e) {}
  }
  checkTimer = setTimeout(checkExpired, 600000);
}

function removeFile(filename) {
  fs.unlink(filename, function (err) {
    err && fs.unlink(filename, util.noop);
  });
}

function writeFile(filename, ctn, callback) {
  fs.writeFile(filename, ctn, function (err) {
    if (!err) {
      return callback();
    }
    fs.writeFile(filename, ctn, callback);
  });
}
// 异步重试，出错重试即可
function removeCertFile(filename, type) {
  removeFile(path.join(CUSTOM_CERTS_DIR, filename + '.key'));
  removeFile(path.join(CUSTOM_CERTS_DIR, filename + type));
}
// 异步写入，出错重试即可
function writeCertFile(filename, type, cert, mtime) {
  var keyFile = path.join(CUSTOM_CERTS_DIR, filename + '.key');
  var certFile = path.join(CUSTOM_CERTS_DIR, filename + '.' + (type || 'crt'));
  writeFile(keyFile, cert.key, function () {
    fs.utimes && fs.utimes(keyFile, mtime, mtime, util.noop);
  });
  writeFile(certFile, cert.cert, function () {
    fs.utimes && fs.utimes(certFile, mtime, mtime, util.noop);
  });
}

var ILLEGAL_PATH_RE = /[/\\]/;

function checkFilename(name) {
  return name && !ILLEGAL_PATH_RE.test(name) && name !== 'root';
}

function getCertType(type) {
  if (type !== 'cer' && type !== 'pem') {
    return 'crt';
  }
  return type;
}

exports.removeCert = function (opts) {
  if (!CUSTOM_CERTS_DIR) {
    return;
  }
  var filename = opts.filename;
  var type = getCertType(opts.type);
  if (checkFilename(filename) && allCustomCerts[filename]) {
    removeCertFile(filename, type);
    delete allCustomCerts[filename];
    parseAllCustomCerts();
  }
};

exports.uploadCerts = function (certs) {
  if (!CUSTOM_CERTS_DIR) {
    return;
  }
  var now = Date.now();
  var hasChanged;
  var index = 0;
  Object.keys(certs).forEach(function (filename) {
    if (!checkFilename(filename) || filename.length > 128) {
      return;
    }
    var cert = certs[filename];
    if (!cert) {
      return;
    }
    var keyStr, certStr, type;
    if (Array.isArray(cert)) {
      keyStr = cert[0];
      certStr = cert[1];
      type = getCertType(cert[2]);
    } else {
      keyStr = cert.key;
      certStr = cert.cert;
      type = getCertType(cert.type);
    }
    if (util.isString(keyStr) && util.isString(certStr)) {
      var mtime = now + index * 1000;
      ++index;
      try {
        cert = parseCert({
          key: keyStr,
          type: type,
          cert: certStr,
          mtime: mtime
        });
        if (cert) {
          writeCertFile(filename, type, cert.cert, new Date(mtime));
          allCustomCerts[filename] = cert;
          hasChanged = true;
        }
      } catch (e) {}
    }
  });
  hasChanged && parseAllCustomCerts();
};
