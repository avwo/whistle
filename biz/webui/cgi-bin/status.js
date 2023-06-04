var config = require('../../../lib/config');

var pid = process.pid;

module.exports = function(req, res) {
  res.json({
    pid: pid,
    storage: config.storage || '',
    name: config.name,
    version: config.version
  });
};
