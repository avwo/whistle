var stream = require('stream');
var config = require('../../lib/config');
var pluginMgr = require('../../lib/plugins');
var socketMgr = require('../../lib/socket-mgr');

module.exports = function() {
  var oldCaptureData = config.captureData;
  var oldGetTunnelPipe = pluginMgr.getTunnelPipe;
  var reqId = 'custom-parser-tunnel-test';
  var req = new stream.PassThrough();
  var res = new stream.PassThrough();
  var proxy = {
    emit: function() {}
  };

  config.captureData = true;
  socketMgr(proxy);
  req.reqId = reqId;
  req.fullUrl = 'tunnel://custom.parser.test:1234';
  req.headers = {};
  req.enable = {};
  req.disable = {};
  req.rules = {};
  req.customParser = true;
  req.inspectFrames = true;
  req.isPluginReq = false;
  res.headers = req.headers;
  pluginMgr.getTunnelPipe = function(req, res, callback) {
    callback();
  };

  try {
    socketMgr.setPending(req);
    socketMgr.handleConnect(req, res, false);
    var data = socketMgr.getData(reqId);
    data.should.be.an.Object();
  } finally {
    socketMgr.destroy(reqId);
    pluginMgr.getTunnelPipe = oldGetTunnelPipe;
    config.captureData = oldCaptureData;
  }
};
