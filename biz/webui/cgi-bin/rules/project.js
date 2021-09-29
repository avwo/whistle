var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  var name = body.name;
  var rulesText = body.rules || body.value;
  if (!rulesText || !name || typeof rulesText !== 'string') {
    if (body.enable == 1) {
      rules.select(name);
    }
    if (body.top == 1) {
      rules.moveToTop(name);
    }
    return res.json({ ec: 0, rules: !!rules.get(name) });
  }
  rules.add(name, rulesText);
  rules.select(name);
  rules.moveToTop(name);
  res.json({ ec: 0 });
};
