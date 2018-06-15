var rules = require('../../lib/rules');

module.exports = function(req, res) {
  var body = req.body;
  var name = body.name;
  if (!body.rules || !name) {
    return res.json({ ec: 0, rules: !!rules.get(name) });
  }
  rules.add(name, body.rules);
  rules.select(name);
  var first = rules.list()[0];
  if (first) {
    rules.moveTo(name, first.name);
  }
  res.json({ ec: 0 });
};
