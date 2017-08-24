var rules = require('../../lib/rules');

module.exports = function(req, res) {
  var body = req.body;
  rules.add(body.name, body.value, body.clientId);
  res.json({ec: 0, em: 'success'});
};
