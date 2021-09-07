var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  res.json({
    ec: 0,
    enableCapture: properties.isEnableCapture(),
    enableHttp2: properties.isEnableHttp2()
  });
};
