var util = require('../util.test');

module.exports = function() {
  util.request('ws://test.whistlejs.com/index.html', function(data) {
    data.host.should.equal('127.0.0.1:8080');
  });

  util.request('wss://ws1.test.whistlejs.com/index.html', function(data) {
    data.host.should.equal('127.0.0.1:9999');
  });
  util.request('wss://test.whistlejs.com/ups.html?abc=123', function(data) {
    // data.host.should.equal('127.0.0.1:9999');
  });
  util.request('wss://test.whistlejs.com/index2.html?abc=321', function(data) {
    data.host.should.equal('127.0.0.1:8080');
  });
  util.requestWS('ws://test.whistlejs.com/index2.html?abc=321', function(data) {
    data.host.should.equal('127.0.0.1:8080');
  });
  util.requestWS('ws://status.whistlejs.com/checkStatusCode.html', function(data) {
    data.should.equal('checkStatusCode');
  });
};
