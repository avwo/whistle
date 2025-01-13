var properties = require('../../../lib/rules/util').properties;
var getRootCAFile = require('../../../lib/https/ca').getRootCAFile;

module.exports = function(req, res) {
  var type = req.query.type;
  if (type !== 'crt' && type !== 'pem') {
    type = 'cer';
  }
  if (req.query.enableHttps) {
    properties.setEnableCapture(true);
  }
  res.download(getRootCAFile(), 'rootCA.' + type);
};
