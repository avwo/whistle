var assert = require('./assert');

module.exports = function(server) {
  server.on('request', function(req, res) {
    assert(req);
    req.on('data', (data) => {
      return res.write(data);
    });
    req.on('end', () => res.end());
  });
};
