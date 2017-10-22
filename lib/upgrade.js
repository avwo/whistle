
function upgradeHandler(req, socket) {
  console.log(req.headers)
}

module.exports = function(server, proxy) {
  server.on('upgrade', upgradeHandler);
};
