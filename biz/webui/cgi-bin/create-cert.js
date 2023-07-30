var Zip = require('adm-zip');
var Buffer = require('safe-buffer').Buffer;
var qs = require('querystring');
var ca = require('../../../lib/https/ca');
var sendError = require('./util').sendError;

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
  zip.addFile(dir + '.crt', Buffer.from(cert.cert));
  zip.addFile(dir + '.key', Buffer(cert.key));
  zip.toBuffer(function(body) {
    res.attachment(domain + '.zip').send(body);
  }, function(err) {
    sendError(res, err);
  });
};
