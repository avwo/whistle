/**
 * 出错直接关闭
 */
module.exports = function(server, options) {
  server.on('request', function(req, res) {
    req.setEncoding('utf8');
    var body = '';
    req.on('data', function(data) {
      body += data;
    });
    req.on('end', function() {
      res.end();
    });
  });
};
