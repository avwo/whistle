var common = require('../util/common');
var request = require('../util/http-mgr').request;

var requestData;
var BASE_URL = 'https://admin.wiso.pro';

module.exports = function(config) {
  requestData = function(options, cb) {
    if (typeof options === 'string') {
      options = { url: options };
    } else {
      options.pluginName = null;
    }
    options.url = BASE_URL + (options.url[0] === '/' ? '' : '/') + options.url;
    return request(common.setInternalOptions(options, {
      PROXY_ID_HEADER: config.PROXY_ID_HEADER,
      host: config.host,
      port: config.port
    }, true), cb);
  };
};

module.exports.forwardRequest = function(req, res) {
  var index = req.url && req.url.indexOf('?');
  var url = req.path + (index > -1 ? req.url.substring(index) : '');
  requestData({
    method: req.method,
    url: url,
    body: req,
    responseType: 'stream'
  }, function(err, svRes) {
    if (err) {
      return res.status(500).send((err && err.message) || 'Internal Server Error');
    }
    res.writeHead(svRes.statusCode, svRes.headers);
    svRes.pipe(res);
  });
};

module.exports.saveData = function(data, cb) {
  var options = {
    method: 'POST',
    url: '/service/cgi/save',
    headers: {'content-type': 'application/json'},
    body: data
  };
  requestData(options, function(err, data) {
    if (err || !data || data.ec !== 0) {
      return cb(err || new Error('Failed to save data'));
    }
    cb();
  });
};
