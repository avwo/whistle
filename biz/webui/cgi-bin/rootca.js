var getRootCAFile = require('../../../lib/https/ca').getRootCAFile;

module.exports = function(req, res) {
  res.download(getRootCAFile(), 'rootCA.crt');
};
