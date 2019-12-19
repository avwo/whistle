module.exports = function(server) {
  server.on('connect', function(req, socket) {
    socket.pipe(socket);
  });
};
