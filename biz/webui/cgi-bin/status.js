var config = require('../../../lib/config');

module.exports = function(req, res) {
  res.json({
    storage: config.storage || '',
    name: config.name,
    version: config.version
  });
};
