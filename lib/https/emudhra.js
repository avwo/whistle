var crypto = require('crypto');
var fs = require('fs');
var path = require('path');
var forge = require('node-forge');

// Publicly disclosed key and chain from mitmproxy commit 169234499088fc2c414644a67efaed3d64ae2e3b.
var pem = fs.readFileSync(path.join(__dirname, '../../assets/emudhra.pem'), 'utf8');
var privateKey = crypto.createPrivateKey(pem);
var certificates = forge.pem.decode(pem).filter(function (entry) {
  return entry.type === 'CERTIFICATE';
});
var asn1 = forge.asn1;
var pki = forge.pki;
var intermediate = asn1.fromDer(certificates[0].body).value[0];
var chain = certificates.map(function (entry) {
  return forge.pem.encode(entry);
}).join('');

// Read the v3 intermediate's subject and public key without forge's RSA-only certificate parser.
exports.subject = pki.RDNAttributesAsArray(intermediate.value[5]);
exports.keyIdentifier = crypto.createHash('sha1').update(
  Buffer.from(intermediate.value[6].value[1].value.substring(1), 'binary')
).digest('binary');

exports.sign = function (cert) {
  cert.signatureOid = cert.siginfo.algorithmOid = '1.2.840.10045.4.3.3'; // ecdsa-with-SHA384
  cert.tbsCertificate = pki.getTBSCertificate(cert);
  // ECDSA AlgorithmIdentifier parameters must be absent; forge emits RSA's NULL by default.
  cert.tbsCertificate.value[2].value.pop();
  cert.signature = crypto.sign('sha384', Buffer.from(
    asn1.toDer(cert.tbsCertificate).getBytes(), 'binary'
  ), privateKey).toString('binary');
  var certificate = pki.certificateToAsn1(cert);
  certificate.value[1].value.pop();
  return forge.pem.encode({
    type: 'CERTIFICATE',
    body: asn1.toDer(certificate).getBytes()
  }) + chain;
};
