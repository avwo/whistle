var util = require('../util.test');

module.exports = function() {
  util.request('http://urlparams.test.whistlejs.com/index.html', function(res, data) {
    // data.url.substring(data.url.indexOf('?') + 1).should.equal('test=abc');
  });

  util.request({
    method: 'post',
    url: 'http://urlparams.test.whistlejs.com/index.html'
  }, function(res, data) {
    // data.url.substring(data.url.indexOf('?') + 1).should.equal('test=abc');
  });
};
