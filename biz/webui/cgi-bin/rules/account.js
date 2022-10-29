var getAccountRules = require('../../../../lib/rules/util').getAccountRules;

module.exports = function(_, res) {
  res.json({ec: 0, rules: getAccountRules() });
};
