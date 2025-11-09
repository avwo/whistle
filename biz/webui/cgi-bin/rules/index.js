var rules = require('../../../../lib/rules/util').rules;
var properties = require('../../../../lib/rules/util').properties;

module.exports = function get() {
  return {
    ec: 0,
    enabledCount: rules.getEnabledRules().length,
    defaultRulesIsDisabled: rules.defaultRulesIsDisabled(),
    defaultRules: rules.getDefault(),
    allowMultipleChoice: properties.get('allowMultipleChoice'),
    backRulesFirst: properties.get('backRulesFirst'),
    list: rules.list()
  };
};
