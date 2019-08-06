var getCustomCertsInfo = require('../../../lib/https/ca').getCustomCertsInfo;

module.exports = function(req, res) {
  res.json(getCustomCertsInfo());
};
