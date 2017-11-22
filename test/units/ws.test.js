var util = require('../util.test');

module.exports = function() {
  if (/^v0\.10\./.test(process.version)) {
    return;
  }

  util.request('ws://test.whistlejs.com/index.html', function(data) {
    data.host.should.equal('127.0.0.1:8080');
  });

  util.request('wss://ws1.test.whistlejs.com/index.html', function(data) {
    data.host.should.equal('127.0.0.1:9999');
  });
  util.request('wss://test.whistlejs.com/urlParams.html?abc=123', function(data) {
    data.host.should.equal('127.0.0.1:9999');
  });
  util.request('wss://test.whistlejs.com/index2.html?abc=321', function(data) {
    data.host.should.equal('127.0.0.1:8080');
  });
};
