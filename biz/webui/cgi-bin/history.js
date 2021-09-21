var util = require('./util');
var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  util.sendGzip(req, res, properties.getHistory());
};
