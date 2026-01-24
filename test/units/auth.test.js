var util = require('../util.test');

module.exports = function() {
  util.request('http://au2th.test.whistlejs.com/index.html', function(res, data) {
    data.headers.should.not.have.property('authorization');
  });

  util.request({
    method: 'put',
    url: 'https://auth.test.whistlejs.com/index2.html'
  }, function(res, data) {
    data.headers.should.have.property('authorization');
  });
  util.request('http://auth-test.whistlejs.com/test-plugin-auth-hook/forbidden?doNotParseJson', function(res, data) {
    data.should.equal('test-plugin-auth-hook');
  });
  util.request('http://auth-test.whistlejs.com/test-plugin-auth-hook/forbidden/login?doNotParseJson', function(res, data) {
    res.headers['www-authenticate'].should.equal('Basic realm=User Login');
    data.should.equal('test-plugin-auth-hook/login');
  });
  util.request('http://auth-test.whistlejs.com/test-plugin-auth-hook/', function(res, data) {
    data.type.should.equal('server');
  });
};
