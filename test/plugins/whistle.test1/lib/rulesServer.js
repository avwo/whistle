
module.exports = function(server, options) {
  server.on('request', function(req, res) {
    res.end('mp1.w2.org/index.html resType://html\nhttps2.w2.org filter://https');
  });
};