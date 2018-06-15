var rules = require('../../lib/rules');

module.exports = function(req, res) {
  var body = req.body;
  console.log(body)
  // var result = rules.moveTo(body.from, body.to, body.clientId);
  res.json({ ec: 0, rules: 1 });
};
