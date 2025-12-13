var properties = require('../../../lib/rules/util').properties;

var DEFAULT_SIZE = 1024 * 1024; // 1MB

module.exports = function(req, res) {
  var size = parseInt(req.body.size, 10);
  properties.set('maxReqMergeSize', size);
  res.json({ ec: 0, size: properties.get('maxReqMergeSize') || DEFAULT_SIZE });
};
