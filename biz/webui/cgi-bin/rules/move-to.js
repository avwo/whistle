var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  var result = rules.moveTo(body.from, body.to, body.clientId);
  res.json({ec: result ? 0 : 2, em: 'success'});
};
