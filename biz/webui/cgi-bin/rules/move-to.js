var rules = require('../../lib/rules');

module.exports = function(req, res) {
  var result = rules.moveTo(req.body.from, req.body.to);
  res.json({ec: result ? 0 : 2, em: 'success'});
};
