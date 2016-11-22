var util = require('../util.test');

module.exports = function() {
  if (/^v0\.10\./.test(process.version)) { //node 0.10不支持socksv5这个模块，暂时屏蔽掉
    return;
  }
  util.request('http://socks2.w2.org/index.html', function(res, body) {
    res.headers['content-type'].should.be.equal('text/html; charset=gbk');
  });
};
