var getRootCAFile = require('../../../lib/https/ca').getRootCAFile;

module.exports = function(req, res) {
  var type = req.query.type;
  if (type !== 'crt' && type !== 'pem') {
    type = 'cer';
  }
  res.download(getRootCAFile(), 'rootCA.' + type);
};
