var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var name = req.body.name;
  var ec = 2;
  var isDefault = name === 'Default';
  var unselectAll = name === false;
  if (isDefault || unselectAll || rules.exists(name)) {
    ec = 0;
    if (isDefault || unselectAll) {
      rules.disableDefault();
    }
    if (!isDefault) {
      rules.unselect(name);
    }
  }
  res.json({ec: ec});
};
