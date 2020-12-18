var createCertificate = require('../../../lib/https/ca').createCertificate;

module.exports = function(req, res) {
  var domain = req.query.domain;
  domain = domain && typeof domain === 'string' && domain.trim();
  if (!domain || domain.length > 64) {
    return res.status(400);
  }
  try {
    var cert = createCertificate(domain);
    res.json({
      ec: 0,
      cert: cert
    });
  } catch (e) {
    res.json({
      ec: 2,
      em: e.message
    });
  }
};
