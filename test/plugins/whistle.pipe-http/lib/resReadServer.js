module.exports = function(server) {
  server.on('request', function(req, res) {
    var body;
    req.on('data', (data) => {
      body = body ? Buffer.concat([body, data]) : data;
    });
    req.on('end', () => res.end(body));
  });
};
