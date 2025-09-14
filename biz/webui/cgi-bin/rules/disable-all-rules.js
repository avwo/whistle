var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  rules.disableAllRules(req.body.disabledAllRules == 1);
  res.json({ec: 0, em: 'success'});
};

