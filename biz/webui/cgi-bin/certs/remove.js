var ca = require('../../../../lib/https/ca');


module.exports = function(req, res) {
  ca.removeCert(req.body.filename);
  res.json(ca.getCustomCertsFiles());
};
