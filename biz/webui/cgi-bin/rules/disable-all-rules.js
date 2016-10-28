var properties = require('../../lib/properties');
var rules = require('../../lib/rules');

module.exports = function(req, res) {
  properties.set('disabledAllRules', req.body.disabledAllRules == 1);
  rules.parseRules();
  res.json({ec: 0, em: 'success'});
};

