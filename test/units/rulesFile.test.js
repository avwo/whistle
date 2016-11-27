var util = require('../util.test');

module.exports = function() {
  if (/^v0\.10\./.test(process.version)) {
    return;
  }
  util.request('http://rf1.w2.org/index.html', function(res, data) {
    data.should.have.property('test', 'values');
  });
  util.request('http://rf2.w2.org/index.html', function(res, data) {
    data.should.have.property('test', 'values2');
  });
  util.request('http://rf3.w2.org/index.html', function(res, data) {
    data.should.have.property('test', 'values3');
  });
};
