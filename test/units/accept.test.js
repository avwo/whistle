var util = require('../util.test');

module.exports = function() {
  util.request({
    url: 'http://accept.test.whistlejs.com/index.html',
    headers: {
      'accept-encoding': 'deflate, gzip'
    }
  }, function(res, data) {
    data.headers.should.have.property('accept', 'xxx');
  });
};
