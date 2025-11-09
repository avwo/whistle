var get = require('./index');
var addRules = require('../../../../lib/rules/util').addRules;
var util = require('../util');

module.exports = function(req, res) {
  util.getReqData(req, function(err, result) {
    if (err) {
      res.status(200).json({ ec: 2, em: err.message });
    } else {
      addRules(result.data, result.replace, req.query.clientId);
      util.sendGzip(req, res, get());
    }
  });
};
