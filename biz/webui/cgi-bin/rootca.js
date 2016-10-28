var httpsUtil = require('../lib/https-util');

module.exports = function(req, res) {
  res.download(httpsUtil.getRootCAFile(), 'rootCA.crt');
};
