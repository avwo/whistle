var proxy = require('../lib/proxy');
var socketMgr = proxy.socketMgr;

module.exports = function(req, res) {
  var result = {};
  req.body.idList.forEach(function(reqId) {
    result[reqId] = socketMgr.getData(reqId);
  });
  req.body.frames.forEach(function(frame) {
    proxy.emit('frame', frame);
  });
  res.json(result);
};
