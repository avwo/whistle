var parseUrl = require('url').parse;
var util = require('../lib/util');
var HTTP_RE = /https?:\/\//i;

module.exports = function(req, res) {
  var url = req.query.url;
  if (HTTP_RE.test(url)) {
    util.getResponseBody(parseUrl(url), function(err, body, response) {
      if (err) {
        return res.json({ec: 2, msg: err.message});
      }
      if (!response || response.statusCode !== 200) {
        return res.json({ec: 2, msg: 'Request failed'});
      }
      return res.json({ec: 0, msg: body});
    });
  } else {
    res.json({ec: 400, msg: 'Bad url'});
  }
};
