var properties = require('../../../lib/rules/util').properties;
var rules = require('../lib/proxy').rules;
var util = require('../../../lib/util');

module.exports = function(req, res) {
  var tunnelUrl = properties.get('showHostIpInResHeaders') ? req.query.url : null;
  req.curUrl = tunnelUrl;
  req.clientIp = util.getClientIp(req);
  req.method = util.getMethod(req.method);
  rules.resolveHost(req, function(err, host) {
    if (err) {
      res.json({ec: 2, em: 'server busy'});
    } else {
      res.json({ec: 0, em: 'success', host: host});
    }
  });
};
