var properties = require('../../lib/properties');

module.exports = function(req, res) {
  properties.set('syncWithSysHosts', req.body.syncWithSysHosts == 1);
  res.json({ec: 0, em: 'success'});
};


