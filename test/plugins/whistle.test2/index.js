exports.statsServer = function(server, options) {
  server.on('request', function(req, res) {
    console.log(decodeURIComponent(req.headers[options.FULL_RULE_HEADER]))
    res.end();
  });
};