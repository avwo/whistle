var config = require('../../../lib/config');

module.exports = function(_, res) {
  res.json({
    whistlePath: config.WHISTLE_PATH,
    whistleName: config.whistleName,
    storage: config.storage || '',
    client: config.client,
    name: config.name,
    version: config.version
  });
};
