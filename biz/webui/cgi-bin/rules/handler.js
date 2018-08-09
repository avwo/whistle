var rules = require('../../lib/rules');

module.exports = function(req, res) {
  console.log(req.body);
  res.json({ ec: 0 });
};
