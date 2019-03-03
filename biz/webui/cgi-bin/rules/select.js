var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  rules.add(body.name, body.value, body.clientId);
  rules.select(req.body.name);
  res.json({ec: 0, em: 'success', defaultRulesIsDisabled: rules.defaultRulesIsDisabled(), list: rules.getSelectedList()});
};
