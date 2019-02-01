var util = require('../util.test');

module.exports = function() {
  util.request({
    uri: 'http://range1.whistlejs.com/index.html',
    headers: {
      'range': 'bytes=2-3,5-6'
    }
  }, function(res, body) {
    body.should.equal(23456);
  });
  util.request({
    url: 'http://range2.whistlejs.com/',
    headers: {
      'range': 'bytes=2-3,1-8'
    }
  }, function(res, body) {
    body.should.equal(12345678);
  });
};
