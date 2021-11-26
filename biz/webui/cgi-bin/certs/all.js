var ca = require('../../../../lib/https/ca');

module.exports = function(req, res) {
  res.json({
    certs: ca.getCustomCertsFiles(),
    dir: ca.CUSTOM_CERTS_DIR
  });
};
