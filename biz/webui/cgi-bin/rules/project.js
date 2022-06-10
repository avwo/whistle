var rules = require('../../../../lib/rules/util').rules;

var DEFAULT_GROUP = '\rothers';

module.exports = function(req, res) {
  var body = req.body;
  var name = typeof body.name === 'string' ? body.name.trim() : null;
  if (!name) {
    return res.json({ ec: 0 });
  }
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
      var group = rules.getFirstGroup();
      if (rules.add(groupName) != null) {
        if (!group && groupName !== DEFAULT_GROUP) {
          rules.add(DEFAULT_GROUP);
          rules.moveToTop(DEFAULT_GROUP);
        }
        rules.moveToGroup(name, groupName, true);
        rules.moveGroupToTop(groupName);
      }
    } else {
      rules.moveToTop(name);
    }
  }
  res.json({ ec: 0 });
};
