var Zip = require('node-native-zip2');
var Buffer = require('safe-buffer').Buffer;
var qs = require('querystring');
var ca = require('../../../lib/https/ca');

var URL_RE = /^(?:([\w.-]+:)?\/\/)?([\w.=&!~*'()%-]+)/i;
var ILLEGAL_CHARS_RE = /[=&!~*'()%]/;

function parseDomain(domain) {
  domain = domain && typeof domain === 'string' && domain.trim();
  if (!domain || domain.length > 256 || !URL_RE.test(domain)) {
    return;
  }
  domain =  RegExp.$2.toLowerCase();
  if (RegExp.$1 === 'root:') {
    return qs.parse(domain);
  }
  return ILLEGAL_CHARS_RE.test(domain) ? null : domain;
}

module.exports = function(req, res) {
  var domain = parseDomain(req.query.domain);
  if (!domain) {
    return res.status(400).end('Bad Request');
  }
  var isStr = typeof domain == 'string';
  var cert = isStr ? ca.createCertificate(domain) : ca.createRootCA(domain);
  var zip = new Zip();
  domain = isStr ? domain : 'root';
  var dir = domain + '/' + domain;
  zip.add(dir + '.crt', Buffer.from(cert.cert));
  zip.add(dir + '.key', Buffer(cert.key));
  res.attachment(domain + '.zip').send(zip.toBuffer());
};
