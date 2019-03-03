var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  rules.enableDefault();
  rules.setDefault(req.body.value, req.body.clientId);
  res.json({ec: 0, em: 'success', defaultRulesIsDisabled: rules.defaultRulesIsDisabled(), list: rules.getSelectedList()});
};
