var properties = require('../../../lib/rules/util').properties;
var config = require('../../../lib/config');

module.exports = function(req, res) {
  properties.setDnsOrder(req.body.order);
  res.json({ec: 0, order: config.dnsOrder});
};