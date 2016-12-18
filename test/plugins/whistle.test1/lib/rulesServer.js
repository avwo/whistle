
module.exports = function(server, options) {
  server.on('request', function(req, res) {
    if (req.headers.host === 'var1.wproxy.org') {
      return res.end(JSON.stringify({
        rules: '/./ file://(${json0}${json1},${json2},${json3}${jsonN})',
        values: {
          json0: '{',
          json1: '"json1": 1',
          json2: '"json2": 2',
          json3: '"json3": 3',
          jsonN: '}'
        }
      }));
    }
    res.end('mp1.w2.org/index.html resType://html\nhttps2.w2.org filter://https');
  });
};