var util = require('../util.test');

module.exports = function() {
  util.request('http://filter.com/index.html', function(res, data) {
    data.should.have.property('ec', 0);
  });

  // util.request({
  //   url: 'https://filter.com/index.html',
  //   method: 'post',
  //   body: 'test'
  // }, function(res, data) {
  //   data.should.have.property('ec', 1);
  // });

  // util.request({
  //   url: 'https://filter.com/index.html',
  //   method: 'delete',
  //   body: 'test',
  //   headers: {
  //     'test': 'abc'
  //   }
  // }, function(res, data) {
  //   data.should.have.property('ec', 2);
  // });

  // util.request({
  //   url: 'https://filter.com/index.html',
  //   method: 'delete',
  //   body: 'test',
  //   headers: {
  //     'test': 'abc',
  //     'x-test': '123'
  //   }
  // }, function(res, data) {
  //   data.should.have.property('ec', 3);
  // });
};