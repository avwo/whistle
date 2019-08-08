var rulesUtil = require('../../../../lib/rules/util');
var values = rulesUtil.values;

module.exports = function get() {
  return {
    ec: 0,
    list: values.list()
  };
};
