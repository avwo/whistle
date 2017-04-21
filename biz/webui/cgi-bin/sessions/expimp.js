var getImpExpService = require('../../lib/proxy').getImpExpService;
var transformReq = require('../../lib/util').transformReq;

module.exports = function(req, res) {
  getImpExpService(function(err, port) {
    if (err) {
      res.type('text').status(500).send(err.stack || err);
    } else {
      transformReq(req, res, port);
    }
  });
};
