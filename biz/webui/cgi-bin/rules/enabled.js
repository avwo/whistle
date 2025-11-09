var rules = require('../../../../lib/rules/util').rules;
var util = require('../util');

module.exports = function(req, res) {
  util.sendGzip(req, res, {
    ec: 0,
    mflag: rules.getMFlag(),
    list: rules.getEnabledRules()
  });
};
