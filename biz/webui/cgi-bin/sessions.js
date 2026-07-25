var util = require('./util');
var proxy = require('../lib/proxy');

module.exports = function(req, res) {
  util.sendGzip(req, res, proxy.getSessionsForApi(req.body));
};
