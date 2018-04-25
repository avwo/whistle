var util = require('../util.test');

module.exports = function() {
  if (/^v0\.10\./.test(process.version) ||  process.versions.modules >= 64) { //node 0.10不支持socksv5这个模块，暂时屏蔽掉
    return;
  }
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

  util.request('http://socks5.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1080);
  });
  util.request('https://socks5.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request('http://socks6.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1118);
  });
  util.request('https://socks6.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request('http://socks7.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1080);
  });
  util.request('https://socks7.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request('http://socks8.w2.org/index.html', function(res, data) {
    data.port.should.be.equal(1118);
  });
  util.request('https://socks8.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });
};
