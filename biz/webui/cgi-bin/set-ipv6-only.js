var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  properties.setIPv6Only(req.body.checked);
  res.json({ec: 0, ipv6Only: req.body.checked});
};
