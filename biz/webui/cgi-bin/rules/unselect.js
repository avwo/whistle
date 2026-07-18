var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  rules.add(body.name, body.value);
  rules.unselect(body.name);
  res.json({ec: 0, defaultRulesIsDisabled: rules.defaultRulesIsDisabled(), list: rules.getSelectedList()});
};
