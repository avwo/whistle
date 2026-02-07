
exports.uiServer = function(server) {
  server.on('request', function(req, res) {
    var key = decodeURIComponent(req.url.substring(req.url.indexOf('=') + 1));
    res.end(key + '/' + req.originalReq.ruleProtocol);
  });
};
