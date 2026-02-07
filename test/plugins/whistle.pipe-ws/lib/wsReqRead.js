var assert = require('./assert');

module.exports = function(server) {
  server.on('connect', function(req, socket) {
    assert(req);
    socket.on('data', (data, opts) => {
      socket.write(data, opts);
    });
  });
};
