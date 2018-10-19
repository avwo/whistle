var util = require('../util.test');

module.exports = function() {
  util.request('http://str.w2.org/index.html?doNotParseJson&a=1&a=2', function(res, body) {
    body.should.equal('?doNotPbrseJson&a=1&a=2');
  });
  util.request('http://str.w2.org/index2.html?doNotParseJson&a=1&a=2', function(res, body) {
    body.should.equal('doNotPbrseJson&b=1&b=2');
  });
  util.request('http://str2.w2.org/index.html?doNotParseJson&a=1&a=2', function(res, body) {
    body.should.equal('?doNotPbrseJson&a=1&a=2');
  });

  util.request('http://str2.w2.org/index2.html?doNotParseJson&a=1&a=2', function(res, body) {
    body.should.equal('doNotPbrseJson&b=1&b=2');
  });
};
