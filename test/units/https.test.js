var util = require('../util.test');
var config = require('../config.test');
var w2Conf = require('../../lib/config');

module.exports = function() {
  util.request('http://127.0.0.1:8080/auto2http.html', function(res, data) {
    data.url.should.be.equal('/auto2http.html');
  });
  util.request('https://https.w2.org/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request('https://https1.w2.org:' + config.httpsPort + '/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request('http://https1.w2.org:' + config.serverPort + '/index.html', function(res, data) {
    data.type.should.be.equal('server');
  });

  util.request('https://https2.w2.org:' + config.httpsPort + '/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request('http://https2.w2.org/index.html', function(res, data) {
    data.type.should.be.equal('server');
  });

  util.request('https://https3.w2.org:5566/index.html', function(res, data) {
    data.body.should.be.equal('test');
  });

  util.request({
    url: 'http://test1.pass.through.com/index.html',
    headers: {
      'x-forwarded-for': '3.3.5.5'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
  });
  util.request({
    url: 'http://test2.pass.through.com/index.html',
    headers: {
      'x-whistle-client-id': 'avenwu-test-id',
      'x-forwarded-for': '3.3.5.5'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
  });
  util.request({
    url: 'http://test3.pass.through.com/index.html',
    headers: {
      'x-whistle-client-id': 'avenwu-test-id',
      'x-forwarded-for': '3.3.5.5',
      [w2Conf.CLIENT_INFO_HEADER]: '5.5.5.5,1234,6.6.6.6,5678'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
  });

  util.request({
    url: 'http://test-req.pass.through.com/index.html',
    method: 'POST',
    body: 'test1',
    headers: {
      'x-whistle-client-id': 'avenwu-test-id',
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'reqBuffer',
      [w2Conf.CLIENT_INFO_HEADER]: '5.5.5.5,1234,6.6.6.6,5678'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
    data.body.should.be.equal('test1 reqBuffer');
  });
  util.request({
    url: 'http://test-req.pass.through.com/index.html',
    method: 'POST',
    body: 'test2',
    headers: {
      'x-whistle-client-id': 'avenwu-test-id',
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'reqText',
      [w2Conf.CLIENT_INFO_HEADER]: '5.5.5.5,1234,6.6.6.6,5678'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
    data.body.should.be.equal('test2 reqText');
  });
  util.request({
    url: 'http://test-req.pass.through.com/index.html',
    method: 'POST',
    body: JSON.stringify({ a: { b: { c: 'test3' } } }),
    headers: {
      'x-whistle-client-id': 'avenwu-test-id',
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'reqJson',
      [w2Conf.CLIENT_INFO_HEADER]: '5.5.5.5,1234,6.6.6.6,5678'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
    JSON.parse(data.body).a.b.c.should.be.equal('streamUtils.readJson');
  });
  util.request({
    url: 'http://test-req.pass.through.com/index.html',
    method: 'POST',
    body: JSON.stringify({ a: { b: { c: 'test3' } } }),
    headers: {
      'x-whistle-client-id': 'avenwu-test-id',
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'reqJson',
      [w2Conf.CLIENT_INFO_HEADER]: '5.5.5.5,1234,6.6.6.6,5678'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
    JSON.parse(data.body).a.b.c.should.be.equal('streamUtils.readJson');
  });

  util.request({
    url: 'http://test-req.pass.through.com/index.html',
    method: 'POST',
    body: JSON.stringify({ a: { b: { c: 'test3' } } }),
    headers: {
      'x-whistle-client-id': 'avenwu-test-id',
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'reqJson2',
      [w2Conf.CLIENT_INFO_HEADER]: '5.5.5.5,1234,6.6.6.6,5678'
    }
  }, function(res, data) {
    data.type.should.be.equal('server');
    JSON.parse(data.body).a.b.c.should.be.equal('streamUtils.readJson');
  });

  util.request({
    url: 'http://test-res.pass.through.com/index.html',
    method: 'POST',
    headers: {
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'resText'
    }
  }, function(res, data) {
    data[1].should.be.equal(123);
  });
  util.request({
    url: 'http://test-res.pass.through.com/index.html',
    method: 'POST',
    headers: {
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'resJson'
    }
  }, function(res, data) {
    data.type.a.b.c.should.be.equal('readJson');
  });

  util.request({
    url: 'http://test-res.pass.through.com/index.html',
    method: 'POST',
    body: JSON.stringify({ a: { b: { c: 'test3' } } }),
    headers: {
      'x-forwarded-for': '3.3.5.5',
      'x-test-cmd': 'reqJson+resJson'
    }
  }, function(res, data) {
    data.type.a.b.c.should.be.equal('resJson');
    JSON.parse(data.body).a.b.c.should.be.equal('reqJson');
  });
};
