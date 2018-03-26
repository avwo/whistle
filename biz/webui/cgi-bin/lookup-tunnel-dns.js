var properties = require('../lib/properties');
var rules = require('../lib/proxy').rules;

module.exports = function(req, res) {
  var tunnelUrl = properties.get('showHostIpInResHeaders') ? req.query.url : null;
  rules.resolveHost(tunnelUrl, function(err, host) {
    if (err) {
      res.json({ec: 2, em: 'server busy'});
    } else {
      res.json({ec: 0, em: 'success', host: host});
    }
  });
};
