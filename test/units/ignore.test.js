var util = require('../util.test');

module.exports = function() {
  util.request('https://enable1.w2.org', function(res, data) {
    data.url.should.be.equal('https://enable1.w2.org/');
  });
  util.request('https://enable2.w2.org:5566', function(res, data) {
    data.body.should.be.equal('test');
  });
  util.request('https://enable3.w2.org:5566', function(res, data) {
    data.url.should.be.equal('https://enable3.w2.org:5566/');
  });
  util.request('https://enable4.w2.org:5566', function(res, data) {
    data.body.should.be.equal('test');
  });
};
