var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  rules.disableDefault();
  res.json({ec: 0, em: 'success', defaultRulesIsDisabled: rules.defaultRulesIsDisabled(), list: rules.getSelectedList()});
};
