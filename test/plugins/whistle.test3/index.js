exports.reqRulesServer = function(server) {
  server.on('request', function(req, res) {
    res.end('tp.w2.org/index.html resType://html rulesFile://{rulesFile.js}');
  });
};