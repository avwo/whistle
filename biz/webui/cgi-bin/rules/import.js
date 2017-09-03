var get = require('./index');
var getReqData = require('../util').getReqData;
var rulesUtil = require('../../lib/rules-util');

module.exports = function(req, res) {
  getReqData(req, function(err, result) {
    if (err) {
      res.status(200).json({ ec: 2, em: err.message });
    } else {
      rulesUtil.addRules(result.data, result.replace, req.query.clientId);
      res.json(get());
    }
  });
};
