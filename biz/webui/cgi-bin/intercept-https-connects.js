var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  properties.setEnableCapture(req.body.interceptHttpsConnects == 1);
  res.json({ec: 0, em: 'success'});
};

