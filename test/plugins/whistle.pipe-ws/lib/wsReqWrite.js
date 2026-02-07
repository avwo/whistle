var assert = require('./assert');

module.exports = function(server) {
  server.on('connect', function(req, socket) {
    assert(req);
    socket.pipe(socket);
  });
};
