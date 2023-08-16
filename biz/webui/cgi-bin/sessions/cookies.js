var sendGzip = require('../util').sendGzip;
var proxy = require('../../lib/proxy');

module.exports = function(req, res) {
  sendGzip(req, res, {
    ec: 0,
    cookies: proxy.getCookiesByDomain(req.query.domain)
  });
};
