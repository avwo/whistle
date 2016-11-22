var util = require('../util.test');

module.exports = function() {
  util.request('http://socks2.w2.org/index.html', function(res, body) {
    res.headers['content-type'].should.be.equal('text/html; charset=gbk');
  });
};
