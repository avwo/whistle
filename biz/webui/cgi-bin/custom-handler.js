var config = require('../../../lib/config');

module.exports = function(req, res) {
  if (!config.customHandler) {
    return res.sendStatus(404);
  }
  config.customHandler(req, res);
};
