var getImpExpService = require('../../lib/proxy').getImpExpService;

module.exports = function(req, res) {
  getImpExpService(function(err, port) {
    console.log(err, port);
  });
  res.json({ec: 0, em: 'success'});
};
