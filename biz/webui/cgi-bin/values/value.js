var values = require('../../../../lib/rules/util').values;

module.exports = function(req, res) {
  res.json({ value: values.get(req.query.key) });
};
