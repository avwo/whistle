
exports.uiServer = function(server) {
  server.on('request', function(req, res) {
    const key = decodeURIComponent(req.url.substring(req.url.indexOf('=') + 1));
    res.end(key + '/' + req.headers['x-whistle-rule-proto']);
  });
};
