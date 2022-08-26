var getRootCAFile = require('../../../lib/https/ca').getRootCAFile;

module.exports = function(req, res) {
  var type = req.query.type;
  if (type !== 'cer' && type !== 'pem') {
    type = 'crt';
  }
  res.download(getRootCAFile(), 'rootCA.' + type);
};
