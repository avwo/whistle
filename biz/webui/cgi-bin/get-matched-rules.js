var proxy = require('../lib/proxy');
var util = require('./util');

module.exports = function(req, res) {
  var reqId = req.query.reqId;
  var item = reqId && proxy.getItem(reqId);
  if (!item) {
    return res.json({});
  }
  util.sendGzip(req, res, {
    realUrl: item.realUrl,
    rules: item.rules
  });
};
