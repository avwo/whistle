var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  var body = req.body;
  rules.rename(body.name, body.newName, body.clientId);
  res.json({ec: 0, em: 'success'});
};
