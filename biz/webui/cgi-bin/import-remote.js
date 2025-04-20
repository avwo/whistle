var util = require('../../../lib/util');
var loadService = require('../lib/proxy').loadService;

var MAX_LEN = 1024 * 1024 * 6;
var HTTP_RE = /https?:\/\/\S/i;

module.exports = function(req, res) {
  var url = req.query.url;
  if (HTTP_RE.test(url)) {
    util.request({
      url: url,
      maxLength: MAX_LEN
    }, function(err, body, r) {
      if (err) {
        var msg = err.code === 'EEXCEED'  ? 'The size of response body exceeds 6m' : err.message;
        return res.json({ec: 2, em: msg});
      }
      var status = r.statusCode;
      if (status !== 200) {
        var em = status > 200 && status < 400 ? 'No data' : 'Request failed';
        return res.json({ec: 2, em: em + ' (statusCode: ' + status + ')'});
      }
      return res.json({ec: 0, body: body});
    });
  } else if (util.isString(url)) {
    loadService(function(err, options) {
      if (err) {
        res.type('text').status(500).send(err.stack || err);
      } else {
        req.url = '/cgi-bin/sessions/get-temp-file?filename=' + encodeURIComponent(url);
        util.transformReq(req, res, options.port);
      }
    });
  } else {
    res.json({ec: 400, em: 'Bad url'});
  }
};
