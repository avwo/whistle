var socketMgr = require('../../lib/proxy').socketMgr;

module.exports = function(req, res) {
  var result = socketMgr.sendData(req.body);
  res.json({ec: result === false ? 3 : 0});
};
