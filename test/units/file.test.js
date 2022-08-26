var util = require('../util.test');

module.exports = function() {
  util.request('http://file.test.whistlejs.com/index.html', function(res, data) {
    data.should.have.property('body', 'html');
  });

  util.request({
    url: 'https://file.test.whistlejs.com/index.html',
    method: 'post',
    body: util.getTextBySize(3072)
  }, function(res, data) {
    data.should.have.property('body', 'html');
  });
  util.request({
    url: 'http://test-values.whistlejs.com/index.html?doNotParseJson',
    method: 'post',
    body: util.getTextBySize(3072)
  }, function(res, data) {
    res.headers['x-test-res'].should.be.equal('456/resHeaders');
    data.should.equal('x-test-body=测试789/file');
  });
};
