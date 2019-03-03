var rulesUtil = require('../../../../lib/rules/util');
var values = rulesUtil.values;
var properties = rulesUtil.properties;

module.exports = function get() {
  return {
    ec: 0,
    current: properties.get('currentValuesFile'),
    fontSize: properties.get('valuesFontSize'),
    showLineNumbers: properties.get('valuesShowLineNumbers'),
    theme: properties.get('valuesTheme'),
    list: values.list()
  };
};
