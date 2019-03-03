var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  var name = body.name;
  var rulesText = body.rules || body.value;
  if (!rulesText || !name || typeof rulesText !== 'string') {
    return res.json({ ec: 0, rules: !!rules.get(name) });
  }
  rules.add(name, rulesText);
  rules.select(name);
  var first = rules.list()[0];
  if (first) {
    rules.moveTo(name, first.name);
  }
  res.json({ ec: 0 });
};
