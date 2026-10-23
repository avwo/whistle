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
      url: 'http://127.0.0.1:18080/composer-repeat',
      method: 'POST',
      body: 'repeat',
      repeatCount: 3,
      needResponse: true
    })
  }, function(res, data) {
    var bodies = JSON.parse(Buffer.from(data.res.base64, 'base64').toString());
    bodies.should.eql(['repeat', 'repeat', 'repeat']);
  });
};
