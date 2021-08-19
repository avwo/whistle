exports.statsServer = function(server, options) {
  server.on('request', function(req, res) {
    res.end();
  });
};

exports.auth = function() {};
