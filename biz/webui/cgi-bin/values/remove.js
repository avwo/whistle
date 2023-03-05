var util = require('../../../../lib/rules/util');

module.exports = function(req, res) {
  util.removeBatch(util.values, req.body);
  res.json({ec: 0, em: 'success'});
};
