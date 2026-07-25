var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var name = req.body.name;
  var ec = 2;
  if (rules.exists(name)) {
    ec = 0;
    rules.select(name);
  }
  res.json({ec: ec});
};
