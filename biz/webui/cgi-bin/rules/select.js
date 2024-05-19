var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  var exists = rules.exists(body.name);
  var changed;
  if (rules.add(body.name, body.value, body.clientId) && !exists) {
    var group = rules.getFirstGroup();
    if (group) {
      rules.moveTo(body.name, group.name, body.clientId, null, true);
      changed = true;
    }
  }
  rules.select(req.body.name);
  res.json({ec: 0, em: 'success', defaultRulesIsDisabled: rules.defaultRulesIsDisabled(), list: rules.getSelectedList(), changed: changed});
};
