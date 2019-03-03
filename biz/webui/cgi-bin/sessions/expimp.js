var loadService = require('../../lib/proxy').loadService;
var transformReq = require('../../../../lib/util').transformReq;

module.exports = function(req, res) {
  loadService(function(err, options) {
    if (err) {
      res.type('text').status(500).send(err.stack || err);
    } else {
      transformReq(req, res, options.port);
    }
  });
};
