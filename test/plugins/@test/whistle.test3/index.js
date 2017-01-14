exports.reqRulesServer = function(server) {
  server.on('request', function(req, res) {
    res.end('tp.w2.org/index.html resType://html rulesFile://{rulesFile.js}\nths.w2.org file://{test.json}');
  });
};

exports.tunnelRulesServer = function(server) {
  server.on('request', function(req, res) {
    res.end('ths.w2.org filter://https');
  });
};