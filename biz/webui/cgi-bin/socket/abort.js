var proxy = require('../../lib/proxy');

var socketMgr = proxy.socketMgr;

module.exports = function(req, res) {
  var reqId = req.body.reqId;
  proxy.abortRequest(reqId);
  socketMgr.abort(req.body.reqId);
  res.json({ec: 0});
};
