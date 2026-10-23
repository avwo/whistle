var util = require('../util.test');

module.exports = function () {
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    json: {
      url: 'http://127.0.0.1:18080',
      headers: 'test: 123',
      method: 'POST',
      body: 'test'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    json: {
      url: 'http://127.0.0.1:18080',
      headers: 'test: 123',
      method: 'POST',
      body: 'test'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    json: {
      url: 'http://127.0.0.1:18080',
      headers: 'test: 123',
      method: 'POST',
      body: 'test'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    json: {
      url: 'http://127.0.0.1:18080',
      headers: 'test: 123',
      method: 'POST',
      body: 'test'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    json: {
      url: 'http://127.0.0.1:18080',
      headers: 'test: 123',
      method: 'POST',
      body: 'test'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    json: {
      url: 'http://127.0.0.1:18080',
      headers: 'test: 123',
      method: 'POST',
      body: 'test'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      url: 'http://user%40mail:p%3Ass@127.0.0.1:18080/composer-auth',
      method: 'GET',
      needResponse: true
    })
  }, function(res, data) {
    var echo = JSON.parse(Buffer.from(data.res.base64, 'base64').toString());
    // the credentials are sent as basic auth, not as part of the Host header
    echo.headers.host.should.equal('127.0.0.1:18080');
    echo.headers.authorization.should.equal('Basic ' + Buffer.from('user@mail:p:ss').toString('base64'));
  });
};
