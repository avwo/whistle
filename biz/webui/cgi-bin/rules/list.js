var rules = require('../../lib/rules');

module.exports = function(req, res) {
  res.json({ ec: 0, list: rules.list() });
};
