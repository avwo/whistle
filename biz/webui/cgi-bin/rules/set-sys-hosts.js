var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  rules.setSysHosts(req.body.hosts, function(err) {
    res.json({ec: err ? 2 : 0, em: err ? err.stack : 'success'});
  });
};
