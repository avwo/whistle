var util = require('../util.test');
var config = require('../config.test');
var w2Conf = require('../../lib/config');
var assert = require('assert');
var crypto = require('crypto');
var ca = require('../../lib/https/ca');

module.exports = function() {
  assert.strictEqual(!!w2Conf.emudhra, process.argv.indexOf('--emudhra') !== -1);
  ['emudhra.example', '127.0.0.1', '::1'].forEach(function(hostname) {
    var pair = ca.createCertificate(hostname);
    var chain = pair.cert.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g).map(function(pem) {
      return new crypto.X509Certificate(pem);
    });
    var leaf = chain[0];
    assert(leaf.checkPrivateKey(crypto.createPrivateKey(pair.key)));
    assert(hostname === 'emudhra.example' ? leaf.checkHost(hostname) : leaf.checkIP(hostname));
    if (w2Conf.emudhra) {
      assert.strictEqual(chain.length, 3);
      assert(chain[1].subject.indexOf('CN=EM OV TLS CA - G3C') !== -1);
      assert.strictEqual(leaf.issuer, chain[1].subject);
      assert(leaf.verify(chain[1].publicKey));
      assert(chain[1].verify(chain[2].publicKey));
      assert(!leaf.verify(new crypto.X509Certificate(ca.getRootCA().cert).publicKey));
    } else {
      assert.strictEqual(chain.length, 1);
      assert(leaf.verify(new crypto.X509Certificate(ca.getRootCA().cert).publicKey));
    }
    var servername = hostname[0] === ':' ? ':' + hostname : hostname;
    var cached = ca.serverAgent.createCertificate(servername);
    assert.strictEqual(ca.serverAgent.createCertificate(servername).cert, cached.cert);
  });

  util.request('http://127.0.0.1:18080/auto2http.html', function(res, data) {
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
