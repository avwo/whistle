var util = require('../util.test');

module.exports = function() {
  util.request('https://wildcard.cn/abc/index.html', function(res, data) {
    data.name.should.be.equal('http');
  });

  util.request('https://www.qq.wildcard.cn/abc/index.html', function(res, data) {
    data.name.should.be.equal('https');
  });
  util.request({
    url: 'http://www.qq.wildcard1.cn/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    data.name.should.be.equal('https');
  });
  util.request('http://www.wildcard1.com/abc/index.html', function(res, data) {
    data.name.should.be.equal('https');
  });
  util.request({
    url: 'https://w2.w1.wildcard1.com/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    data.name.should.be.equal('http');
  });

  util.request({
    url: 'http://www.qq.wildcard3.cn/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    data.name.should.be.equal('https');
  });
  util.request('http://www.wildcard3.com/abc/index.html', function(res, data) {
    data.name.should.be.equal('https');
  });
  util.request({
    url: 'http://w2.w1.wildcard3.com/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    data.name.should.be.equal('http');
  });


  util.request('http://www.wildcard2.com/1/2/3/abc/index.html', function(res, data) {
    data.name.should.be.equal('http');
  });
  util.request({
    url: 'http://w2.w1.wildcard2.com/1/2/3/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    data.name.should.be.equal('http');
  });

  util.request('http://www.wildcard2.com/1/2/3/abc/index.html', function(res, data) {
    data.name.should.be.equal('http');
  });
  util.request({
    url: 'http://w2.w1.wildcard2.com/1/2/3/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    data.name.should.be.equal('http');
  });

  util.request('https://www.wildcard2.com/abc/index.html', function(res, data) {
    data.name.should.be.equal('https');
  });
  util.request({
    url: 'https://w2.w1.wildcard2.com/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    data.name.should.be.equal('https');
  });
};
