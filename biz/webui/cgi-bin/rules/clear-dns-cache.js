var clearDnsCache = require('../../../../lib/rules/dns').clearCache;

module.exports = function(req, res) {
  clearDnsCache();
  res.json({ec: 0, em: 'success'});
};

