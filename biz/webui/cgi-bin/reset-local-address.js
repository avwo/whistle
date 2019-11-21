var util = require('../../../lib/util');

module.exports = function(req, res) {
  util.localIpCache.reset();
  res.json({ec: 0, em: 'success'});
};
