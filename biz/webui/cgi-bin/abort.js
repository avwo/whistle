var proxy = require('../lib/proxy');
var socketMgr = proxy.socketMgr;

var MAX_COUNT = 1200;

module.exports = function(req, res) {
  var list = req.body.list;
  if (list && typeof list === 'string') {
    list = list.split(',');
    var len = list.length;
    if (len > MAX_COUNT) {
      len = MAX_COUNT;
      list = list.slice(0, MAX_COUNT);
    }
    for (var i = 0; i < len; i++) {
      var reqId = list[i];
      if (reqId) {
        proxy.abortRequest(reqId);
        socketMgr.abort(reqId);
      }
    }
  }
  res.json({ ec: 0 });
};
