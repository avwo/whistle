var parseUrl = require('url').parse;
var util = require('../lib/util');
var HTTP_RE = /https?:\/\//i;

module.exports = function(req, res) {
  var url = req.query.url;
  if (HTTP_RE.test(url)) {
    util.getResponseBody(parseUrl(url), function(err, body, response) {
      if (err) {
        return res.json({ec: 2, em: err.message});
      }
      var status = response && response.statusCode;
      if (status !== 200) {
        var em = status > 200 && status < 400 ? 'No body data' : 'Request failed';
        return res.json({ec: 2, em: em + ' (statusCode: ' + status + ')'});
      }
      return res.json({ec: 0, body: body});
    });
  } else {
    res.json({ec: 400, em: 'Bad url'});
  }
};
