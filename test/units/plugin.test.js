var util = require('../util.test');

module.exports = function() {
  util.request({
    url: 'http://headerreplace.plugin.whistlejs.com:1234/index.html',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.headers.host.should.equal('test.whistlejs.com:1234');
    res.headers['set-cookie'].join().should.equal('abc,abc222');
  });

  util.request('http://plugin.whistlejs.com:1234/index.html', function(res, data) {
    data.should.have.property('type', 'server');
  });

  util.request('wss://321.whistlejs.com/index.html', function(data) {
    data.ruleValue.should.equal('abc');
  });

  util.request('wss://321.ws1.whistlejs.com:2222/index.html', function(data) {
    data.host.should.equal('127.0.0.1:9999');
  });
};
