var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var name = req.body.name;
  var isDefault = name === 'Default';
  var ec = 2;
  if (isDefault || rules.exists(name)) {
    ec = 0;
    if (isDefault) {
      rules.enableDefault();
    } else {
      rules.select(name);
    }
  }
  res.json({ec: ec});
};
