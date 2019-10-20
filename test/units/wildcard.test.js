var util = require('../util.test');
var assert = require('assert');

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

  util.request('https://test.wildcard5.com/abc/index.html', function(res, data) {
    data.list[10].should.be.equal('a\rb\nc');
    data.list[20].should.be.equal(123);
    data.list[30].should.be.equal('123');
    data.list[40].a.should.be.equal('123');
  });

  util.request('https://test.wildcard5.com/wildcard5/_____/abc/index.html?test=123', function(res, data) {
    data.list[10].should.be.equal('a\rb\nc');
    data.list[20].should.be.equal(123);
    data.list[30].should.be.equal('123');
    data.list[40].a.should.be.equal('123');
    data.ec.should.be.equal('abc/index.html');
  });

  util.request('https://w1.test.wildcard5.com/abc/index.html', function(res, data) {
    data.list[10].should.be.equal('a\rb\nc');
    data.list[20].should.be.equal(123);
    data.list[30].should.be.equal('123');
    data.list[40].a.should.be.equal('123');
  });
  util.request({
    url: 'https://w2.w1.test.wildcard5.com/abc/index.html',
    method: 'post',
    body: 'sssssss'
  }, function(res, data) {
    assert(data.list === undefined);
  });
};
