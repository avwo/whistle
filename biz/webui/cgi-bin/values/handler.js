var values = require('../../lib/values');

module.exports = function(req, res) {
  console.log(req.body);
  res.json({ ec: 0 });
};
