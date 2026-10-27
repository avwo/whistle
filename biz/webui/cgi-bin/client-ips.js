var util = require('../../../lib/util');
var sendGzip = require('../../../lib/util').sendGzip;

module.exports = function(req, res) {
  sendGzip(req, res, util.getClientIpList());
};

