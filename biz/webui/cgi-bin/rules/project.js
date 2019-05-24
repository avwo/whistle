var rules = require('../../../../lib/rules/util').rules;

function moveToTop(name) {
  var first = rules.list()[0];
  if (first) {
    rules.moveTo(name, first.name);
  }
}

module.exports = function(req, res) {
  var body = req.body;
  var name = body.name;
  var rulesText = body.rules || body.value;
  if (!rulesText || !name || typeof rulesText !== 'string') {
    if (body.enable == 1) {
      rules.select(name);
    }
    if (body.top == 1) {
      moveToTop(name);
    }
    return res.json({ ec: 0, rules: !!rules.get(name) });
  }
  rules.add(name, rulesText);
  rules.select(name);
  moveToTop(name);
  res.json({ ec: 0 });
};
