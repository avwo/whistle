module.exports = function(server) {
  server.on('request', function(req, res) {
    req.pipe(res);
  });
};
