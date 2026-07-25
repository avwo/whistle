var util = require('./util');
var common = require('../../../lib/util/common');
var proxy = require('../lib/proxy');

module.exports = function(req, res) {
  var body = req.body;
  if (!common.isString(body.reqId)) {
    res.statusCode = 400;
    return res.end('reqId is required');
  }
  util.sendGzip(req, res, proxy.getFramesForApi(body));
};
