var get = require('./index');
var util = require('../util');

module.exports = function(req, res) {
  util.sendGzip(req, res, get());
};
