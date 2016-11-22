var util = require('../util.test');

module.exports = function() {
  util.request('http://mp1.w2.org/index.html', function(res, data) {
    res.headers['content-type'].should.be.equal('text/html; charset=gbk');
    data.headers['x-whistle-rule-value'].should.be.equal('123');
  });
};
