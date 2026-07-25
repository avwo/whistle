var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var name = req.body.name;
  var ec = 2;
  if (name === false || rules.exists(name)) {
    ec = 0;
    rules.unselect(name);
  }
  res.json({ec: ec});
};
