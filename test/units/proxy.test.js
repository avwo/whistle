var util = require('../util.test');

module.exports = function() {
  util.request('http://proxy.test.whistlejs.com/index.html', function(res, data) {
    data.should.have.property('url', 'http://proxy.test.whistlejs.com/index.html');
  });

  util.request({
    method: 'post',
    url: 'http://proxy.test.whistlejs.com/index.html',
    body: 'xxxxx'
  }, function(res, data) {
    data.should.have.property('url', 'http://proxy.test.whistlejs.com/index.html');
  });

};
