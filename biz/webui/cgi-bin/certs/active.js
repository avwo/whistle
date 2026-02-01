var ca = require('../../../../lib/https/ca');

module.exports = function(req, res) {
  ca.setActiveCert(req.body);
  res.json(ca.getCustomCertsFiles());
};
