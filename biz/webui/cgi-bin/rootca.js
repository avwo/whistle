var getRootCAFile = require('../../../lib/https/ca').getRootCAFile;

module.exports = function(req, res) {
  res.download(getRootCAFile(), 'rootCA.' + (req.query.type === 'cer' ? 'cer' : 'crt'));
};
