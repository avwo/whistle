var Zip = require('node-native-zip2');
var Buffer = require('safe-buffer').Buffer;
var createCertificate = require('../../../lib/https/ca').createCertificate;

var URL_RE = /^(?:(?:[\w.-]+:)?\/\/)?([\w.-]+)/i;

function parseDomain(domain) {
  domain = domain && typeof domain === 'string' && domain.trim();
  if (!domain || domain.length > 64 || !URL_RE.test(domain)) {
    return;
  }
  return RegExp.$1.toLowerCase();
}

module.exports = function(req, res) {
  var domain = parseDomain(req.query.domain);
  if (!domain) {
    return res.status(400).end('Bad Request');
  }
  var cert = createCertificate(domain);
  var zip = new Zip();
  var dir = domain + '/' + domain;
  zip.add(dir + '.crt', Buffer.from(cert.cert));
  zip.add(dir + '.key', Buffer(cert.key));
  res.attachment(domain + '.zip').send(zip.toBuffer());
};
