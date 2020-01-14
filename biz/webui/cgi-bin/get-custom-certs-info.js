var getCustomCertsInfo = require('../../../lib/https/ca').getCustomCertsInfo;
// 给第三方用的，不能删除
module.exports = function(req, res) {
  res.json(getCustomCertsInfo());
};
