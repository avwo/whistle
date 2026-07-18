var rules = require('../../../../lib/rules/util').rules;

module.exports = function(req, res) {
  res.json({ value: rules.get(req.query.name)});
};
