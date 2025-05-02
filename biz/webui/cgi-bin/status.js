var config = require('../../../lib/config');

module.exports = function(_, res) {
  res.json({
    storage: config.storage || '',
    client: config.client,
    whistleName: config.whistleName,
    name: config.name,
    version: config.version
  });
};
