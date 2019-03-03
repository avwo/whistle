var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  rules.remove(req.body.name, req.body.clientId);
  res.json({ec: 0, em: 'success'});
};
