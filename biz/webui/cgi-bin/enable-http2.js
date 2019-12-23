var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  properties.setEnableHttp2(req.body.enableHttp2 == 1);
  res.json({ec: 0, em: 'success'});
};

