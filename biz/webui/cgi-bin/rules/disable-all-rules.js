var properties = require('../../../../lib/rules/util').properties;
var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  properties.set('disabledAllRules', req.body.disabledAllRules == 1);
  rules.parseRules();
  res.json({ec: 0, em: 'success'});
};

