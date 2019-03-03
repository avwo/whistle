var proxy = require('../lib/proxy');
var socketMgr = proxy.socketMgr;

function abort(reqId) {
  proxy.abortRequest(reqId);
  socketMgr.abort(reqId);
}

module.exports = function(req, res) {
  var list = req.body.list;
  if (list && typeof list === 'string') {
    list.split(',').forEach(abort);
  }
  res.json({ ec: 0 });
};
