var forge = require('node-forge');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var pki = forge.pki;
var createSecureContext = require('tls').createSecureContext || crypto.createCredentials;
var util = require('../util');
var config = require('../config');
var oldData = require('../rules/old-data');
var HTTPS_DIR = util.mkdir(path.join(config.DATA_DIR, 'certs'));
var ROOT_KEY_FILE = path.join(HTTPS_DIR, 'root.key');
var ROOT_CRT_FILE = path.join(HTTPS_DIR, 'root.crt');
var cache = {};
var cachePairs = {};
var DEFAULT_CERT_CTX, ROOT_KEY, ROOT_CRT;

function createCertificate(hostname) {
	var cert = cachePairs[hostname];
	if (cert) {
		return cert;
	}
	cert = createCert(pki.setRsaPublicKey(ROOT_KEY.n, ROOT_KEY.e), 
						crypto.createHash('sha1')
								.update(hostname, 'binary')
									.digest('hex'));

	cert.setSubject([{
	  name: 'commonName',
	  value: hostname
	}]);
	
	cert.setIssuer(ROOT_CRT.subject.attributes);
	cert.sign(ROOT_KEY, forge.md.sha256.create());
	cert = cachePairs[hostname] = {
			key: pki.privateKeyToPem(ROOT_KEY),
			cert: pki.certificateToPem(cert)
		};
	return cert;
}

function createRootCA() {
	if (ROOT_KEY && ROOT_CRT) {
		return;
	}
	
	if (oldData.exists) {
		try {
			var rootCA = oldData.getRootCA();
			var rootCAKey = oldData.getRootCAKey();
			if (rootCAKey && rootCA) {
				fs.writeFileSync(ROOT_CRT_FILE, rootCA);
				fs.writeFileSync(ROOT_KEY_FILE, rootCAKey);
			}
		} catch(e) {}
	}
	
	try {
		ROOT_KEY = fs.readFileSync(ROOT_KEY_FILE);
		ROOT_CRT = fs.readFileSync(ROOT_CRT_FILE);
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
		fs.writeFileSync(ROOT_KEY_FILE, pki.privateKeyToPem(ROOT_KEY).toString());
		fs.writeFileSync(ROOT_CRT_FILE, pki.certificateToPem(ROOT_CRT).toString());
	}
	
	exports.DEFAULT_CERT_CTX = DEFAULT_CERT_CTX = createSecureContext({
		key: ROOT_KEY,
		cert: ROOT_CRT
	});
}

function createCACert() {
	var keys = pki.rsa.generateKeyPair(1024);
	var cert = createCert(keys.publicKey);
	var attrs = [ {
		name : 'commonName',
		value : 'WHISTLE'
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
		value : 'DEV'
	}, {
		shortName : 'OU',
		value : 'PROXY'
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

function createCert(publicKey, serialNumber) {
	var cert = pki.createCertificate();
	cert.publicKey = publicKey;
	cert.serialNumber = serialNumber || '01';
	cert.validity.notBefore = new Date();
	cert.validity.notAfter = new Date();
	cert.validity.notAfter
			.setFullYear(cert.validity.notBefore.getFullYear() + 10);
	return cert;
}

function getRootCAFile(callback) {
	return ROOT_CRT_FILE;
}

createRootCA();//启动生成ca
exports.getRootCAFile = getRootCAFile;
exports.createCertificate = createCertificate;
