var proxy = require('../lib/proxy');
var socketMgr = proxy.socketMgr;

module.exports = function(req, res) {
  var frames = proxy.getFrames(req.query);
  if (frames && !frames.length &&
      !socketMgr.exists(req.query.curReqId)) {
    frames = undefined;
  }
  res.json({
    ec: 0,
    frames: frames
  });
};
