var getConfig = require('../../../../lib/rules/util').rules.getConfig;
var util = require('../util');

module.exports = function(req, res) {
  util.sendGzip(req, res, getConfig());
};
