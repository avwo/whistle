var getCustomCertsFiles = require('../../../lib/https/ca').getCustomCertsFiles;

module.exports = function(req, res) {
  res.json(getCustomCertsFiles());
};
