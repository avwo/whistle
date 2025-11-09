var recycleBin = require('../../../../../lib/rules/util').rules.recycleBin;
var util = require('../../util');

module.exports = function(req, res) {
  util.sendGzip(req, res, {
    ec: 0,
    list: recycleBin.list()
  });
};
