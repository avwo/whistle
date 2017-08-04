var values = require('../../lib/values');

module.exports = function(req, res) {
  var result = values.moveTo(req.body.from, req.body.to);
  res.json({ec: result ? 0 : 2, em: 'success'});
};
