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
      var status = response && response.statusCode;
      if (status !== 200) {
        var msg = status > 200 && status < 400 ? 'No body data' : 'Request failed';
        return res.json({ec: 2, msg: msg + ' (statusCode: ' + status + ')'});
      }
      return res.json({ec: 0, msg: body});
    });
  } else {
    res.json({ec: 400, msg: 'Bad url'});
  }
};
