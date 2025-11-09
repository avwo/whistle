var get = require('./index');
var util = require('../util');
var addValues = require('../../../../lib/rules/util').addValues;

module.exports = function(req, res) {
  util.getReqData(req, function(err, result) {
    if (err) {
      res.status(200).json({ ec: 2, em: err.message });
    } else {
      addValues(result.data, result.replace, req.query.clientId);
      util.sendGzip(req, res, get());
    }
  });
};
