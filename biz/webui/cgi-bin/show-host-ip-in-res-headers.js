var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  properties.set('showHostIpInResHeaders', req.body.showHostIpInResHeaders == 1);
  res.json({ec: 0, em: 'success'});
};
