var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  rules.enableBackRulesFirst(req.body.backRulesFirst === '1');
  res.json({ec: 0, em: 'success'});
};
