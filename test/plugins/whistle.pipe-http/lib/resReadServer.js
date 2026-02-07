var assert = require('./assert');

module.exports = function(server) {
  server.on('request', function(req, res) {
    assert(req);
    var body;
    req.on('data', (data) => {
      body = body ? Buffer.concat([body, data]) : data;
    });
    req.on('end', () => res.end(body));
  });
};
