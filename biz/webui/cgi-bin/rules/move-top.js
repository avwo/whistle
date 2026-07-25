var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var name = req.body.name;
  var ec = 2;
  if (name !== 'Default' && rules.exists(name)) {
    ec = 0;
    rules.moveToTop(name);
  }
  res.json({ ec: ec });
};
