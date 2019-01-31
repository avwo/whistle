var util = require('../util.test');

module.exports = function() {
  util.request('http://proxy.test.whistlejs.com/index.html', function(res, data) {
    data.should.have.property('url', 'http://proxy.test.whistlejs.com/index.html');
  });

  util.request({
    method: 'post',
    url: 'http://proxy.test.whistlejs.com/index.html',
    body: 'xxxxx'
  }, function(res, data) {
    data.should.have.property('url', 'http://proxy.test.whistlejs.com/index.html');
  });
  util.request('ws://ws2.w2.org:8081/index.html', function(res, data) {
    res.type.should.be.equal('server');
  });
  util.request('ws://ws3.w2.org:8081/index.html', function(res, data) {
    res.type.should.be.equal('server');
  });
  util.request('ws://ws4.w2.org:8081/index.html', function(res, data) {
    res.type.should.be.equal('server');
  });
  util.request('ws://ws5.w2.org:8081/index.html', function(res, data) {
    res.type.should.be.equal('server');
  });
  util.request('http://127.0.0.1:8080/xproxy.html', function(res, data) {
    data.type.should.be.equal('server');
  });
};
