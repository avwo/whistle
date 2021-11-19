var ca = require('../../../../lib/https/ca');


module.exports = function(req, res) {
  ca.uploadCerts(req.body);
  res.json(ca.getCustomCertsFiles());
};
