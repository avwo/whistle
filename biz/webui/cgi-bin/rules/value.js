var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var name = req.query.name;
  if (name === 'Default') {
    return res.json({ value: {
      value: rules.getDefault(),
      selected: !rules.defaultRulesIsDisabled()
    }});
  }
  var value = rules.get(name);
  if (value == null) {
    return res.json({ value: null });
  }
  res.json({ value: {
    value: value,
    selected: rules.isSelected(name)
  }});
};
