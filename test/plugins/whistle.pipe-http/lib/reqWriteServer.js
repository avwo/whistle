var assert = require('./assert');

module.exports = function(server) {
  server.on('request', function(req, res) {
    assert(req);
    req.pipe(res);
  });
};
