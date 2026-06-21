var proxy = require('../lib/proxy');
var util = require('./util');

module.exports = function(req, res) {
  var testId = req.query.testId;
  var item = testId && proxy.getTestItem(testId);
  if (!item) {
    return res.json({});
  }
  util.sendGzip(req, res, {
    realUrl: item.realUrl,
    rules: item.rules
  });
};
