
module.exports = function(server) {
  server.on('connect', function(_, socket) {
    socket.on('data', (data) => {
      socket.write(data);
    });
  });
};
