var protoMgr = require('../rules/protocols');

module.exports = function(req, res, next) {
  var protocol = req.options && req.options.protocol;
  if (!protoMgr.isWebProtocol(protocol)) {
    next();
    return;
  }
  req.request(req.options);
};
