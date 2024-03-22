
module.exports = function(server) {
  server.on('connect', function(_, socket) {
    socket.on('data', (data, opts) => {
      socket.write(data, opts);
    });
  });
};
