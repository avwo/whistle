var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  var name = body.name;
  var rulesText = body.rules || body.value;
  if (!rulesText || !name || typeof rulesText !== 'string') {
    if (body.enable == 1) {
      rules.select(name);
    }
    return res.json({ ec: 0, rules: !!rules.get(name) });
  }
  if (rules.add(name, rulesText) != null) {
    var groupName = typeof body.groupName === 'string' ? body.groupName.trim() : '';
    rules.select(name);
    if (groupName) {
      groupName = '\r' + groupName;
      if (rules.add(groupName) != null) {
        rules.moveToGroup(name, groupName, true);
        rules.moveGroupToTop(groupName);
      }
    } else {
      rules.moveToTop(name);
    }
  }
  res.json({ ec: 0 });
};
