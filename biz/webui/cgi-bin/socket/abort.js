var socketMgr = require('../../lib/proxy').socketMgr;

module.exports = function(req, res) {
  socketMgr.abort(req.body.reqId);
  res.json({ec: 0});
};
