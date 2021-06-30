module.exports = function(server) {
  server.on('request', function(req, res) {
    req.on('data', (data) => {
      return res.write(data);
    });
    req.on('end', () => res.end());
  });
};
