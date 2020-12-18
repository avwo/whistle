var Zip = require('node-native-zip2');
var createCertificate = require('../../../lib/https/ca').createCertificate;

module.exports = function(req, res) {
  var domain = req.query.domain;
  domain = domain && typeof domain === 'string' && domain.trim();
  if (!domain || domain.length > 64) {
    return res.status(400);
  }
  var cert = createCertificate(domain);
  var zip = new Zip();
  var dir = domain + '/' + domain;
  zip.add(dir + '.crt', cert.cert);
  zip.add(dir + '.key', cert.key);
  res.attachment(domain + '.zip').send(zip.toBuffer());
};
