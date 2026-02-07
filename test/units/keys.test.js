var util = require('../util.test');

var mockScriptUrl = 'http://mock.script-key.test.w2.org/test/script/path/to?doNotParseJson';
var serviceScriptUrl = 'http://service.script-key.test.w2.org/test/script/path/to?doNotParseJson';
var shadowScriptUrl = 'http://shadow.script-key.test.w2.org/test/script/path/to?doNotParseJson';

module.exports = function() {
  util.request({
    url: 'http://mock.test.w2.org/path/to?doNotParseJson',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.should.equal('mock');
  });

  util.request({
    url: 'http://mock.script-key.test.w2.org/test/script/api',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.url.should.containEql('api');
  });

  util.request({
    url: 'http://mock.script-key.test.w2.org/test/script/proxy',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.url.should.containEql('proxy');
  });

  util.request({
    url: mockScriptUrl,
    headers: { test: 'abc' }
  }, function(res, data) {
    data.should.equal(mockScriptUrl + 'mock');
  });

  util.request({
    url: 'http://service.test.w2.org/path/to/index2.html?doNotParseJson',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.should.equal('service');
  });

  util.request({
    url: 'http://service.script-key.test.w2.org/test/script/api',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.url.should.containEql('api');
  });

  util.request({
    url: 'http://service.script-key.test.w2.org/test/script/proxy',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.url.should.containEql('proxy');
  });

  util.request({
    url: serviceScriptUrl,
    headers: { test: 'abc' }
  }, function(res, data) {
    data.should.equal(serviceScriptUrl + 'service');
  });

  util.request({
    url: 'http://shadow.test.w2.org/path/to/index.html?doNotParseJson',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.should.equal('shadow');
  });

  util.request({
    url: shadowScriptUrl,
    headers: { test: 'abc' }
  }, function(res, data) {
    data.should.equal(shadowScriptUrl + 'shadow');
  });

  util.request({
    url: 'http://shadow.script-key.test.w2.org/test/script/api',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.url.should.containEql('api');
  });

  util.request({
    url: 'http://shadow.script-key.test.w2.org/test/script/proxy',
    headers: { test: 'abc' }
  }, function(res, data) {
    data.url.should.containEql('proxy');
  });
  util.request('http://default.key.test.w2.org/test/to/index.html?doNotParseJson', function(_, data) {
    data.should.equal('Default');
  });
  util.request('http://test.key.test.w2.org/test/to/index.html?doNotParseJson', function(_, data) {
    data.should.equal('test');
  });
  util.request({
    url: 'http://header.test.weso.org/test/script/proxy?doNotParseJson',
    headers: {
      test: 'abc',
      'x-whistle-rule-value': encodeURIComponent('* file://{test.txt} %pipe-http=doNotParseJson\n%pipe-http=header')
    }
  }, function(res, data) {
    data.trim().should.equal('assets/values');
  });
  util.request({
    url: 'http://header2.test.weso.org/test/script/proxy?doNotParseJson',
    headers: {
      test: 'abc',
      'x-whistle-rule-value': encodeURIComponent('* file://{test.txt}\n``` test.txt\ntest-header\n```')
    }
  }, function(res, data) {
    data.should.equal('test-header');
  });

  util.request('http://wilcardx.wd.w2.org/test/script/proxy', function(_, data) {
    data.ec.should.equal('x');
  });

  util.request('http://wilcardy.wd.w2.org/test/script/proxy', function(_, data) {
    data.ec.should.equal('y');
  });
  util.request('https://wilcardz.wd.w2.org/test/script/proxy', function(_, data) {
    data.ec.should.equal('z');
  });
  util.request('http://sep.path.test.w2.org/.././../index.html', function(_, data) {
    data.ec.should.equal('sep');
  });
};
