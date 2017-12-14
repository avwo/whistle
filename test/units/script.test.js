var util = require('../util.test');

module.exports = function() {
  util.request('http://reqscript.w2.org/index.html?doNotParseJson', function(res, data) {
    data.should.have.equal('123');
    res.headers['x-test'].should.have.equal('123');
  });
  util.request({
    url: 'http://reqscript.w2.org/index.html?doNotParseJson',
    method: 'POST',
    body: 'test'
  }, function(res, data) {
    data.should.have.equal('test');
    res.headers['x-test'].should.have.equal('test');
  });
};
