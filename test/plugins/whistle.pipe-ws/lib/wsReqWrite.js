module.exports = function(server) {
  server.on('connect', function(_, socket) {
    socket.pipe(socket);
  });
};
