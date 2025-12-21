var properties = require('../../../lib/rules/util').properties;
var config = require('../../../lib/config');

module.exports = function(req, res) {
  var order = +req.body.order;
  properties.setDnsOrder(order);
  properties.setIPv6Only(order === 4);
  res.json({ec: 0, order: config.dnsOrder});
};
