var util = require('../util.test');

module.exports = function() {
  util.request('https://tp.w2.org/index.html', function(res, data, err) {
    data.ruleValue.should.be.equal('global');
    res.headers['content-type'].should.be.equal('text/html');
  });

  util.request({
    method: 'post',
    url: 'https://tp.w2.org/index.html',
    isTunnel: true
  }, function(res, data, err) {
    data.body.should.be.equal('test');
    (res.headers['content-type'] | '').should.not.be.equal('text/html');
  });
};
