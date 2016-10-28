var rules = require('../../lib/rules');

module.exports = function(req, res) {
  rules.getSysHosts(function(err, hosts) {
    res.json({ec: err ? 2 : 0, em: err ? err.stack : 'success', hosts: hosts});
  });
};
