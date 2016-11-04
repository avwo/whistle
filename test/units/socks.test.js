var util = require('../util.test');

module.exports = function() {
  util.request('http://socks1.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1080);
  });
  util.request('https://socks1.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
  
  util.request('http://socks2.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1118);
  });
  util.request('https://socks2.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
  
  util.request('http://socks3.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1080);
  });
  util.request('https://socks3.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
  
  util.request('http://socks4.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1118);
  });
  util.request('https://socks4.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
};
