var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  rules.add(req.body.name, req.body.value);
  rules.unselect(req.body.name);
  res.json({ec: 0, em: 'success', defaultRulesIsDisabled: rules.defaultRulesIsDisabled(), list: rules.getSelectedList()});
};
