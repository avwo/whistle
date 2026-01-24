
var util = require('../util.test');

module.exports = function() {
  util.request('https://local.whistlejs.com/favicon.ico?doNotParseJson');
  util.request('https://local.whistlejs.com/?doNotParseJson');
  util.request('http://rd2webui.w2.org/index.html?doNotParseJson');
  util.request('http://rd2webui.w2.org/?doNotParseJson');
  util.request('http://local.whistlejs.com/index.html?doNotParseJson');
  util.request('http://local.whistlejs.com/?doNotParseJson');
  util.request('http://local.whistlejs.com:1234/index.html?doNotParseJson');
  util.request('http://local.whistlejs.com/cgi-bin/log/get');
  util.request('http://local.whistlejs.com/cgi-bin/init');
  util.request('http://local.whistlejs.com:2345/cgi-bin/init');
  util.request('http://local.whistlejs.com/cgi-bin/get-data');
  util.request('http://local.whistlejs.com/cgi-bin/server-info');
  util.request('http://local.whistlejs.com/cgi-bin/values/list');
  util.request('http://local.whistlejs.com/cgi-bin/plugins/get-plugins');
  util.request('http://local.whistlejs.com/cgi-bin/rules/list');
  util.request('http://local.whistlejs.com/cgi-bin/rootca');
  util.request('http://local.whistlejs.com/cgi-bin/root?doNotParseJson', function(res) {
    res.statusCode.should.be.equal(404);
  });

  util.request('https://local.whistlejs.com/index.html?doNotParseJson');
  util.request('https://local.whistlejs.com:1234/index.html?doNotParseJson');
  util.request('https://local.whistlejs.com/cgi-bin/log/get');
  util.request('https://local.whistlejs.com/cgi-bin/init');
  util.request('https://local.whistlejs.com:2345/cgi-bin/init');
  util.request('https://local.whistlejs.com/cgi-bin/get-data');
  util.request('https://local.whistlejs.com/cgi-bin/server-info');
  util.request('https://local.whistlejs.com/cgi-bin/values/list');
  util.request('https://local.whistlejs.com/cgi-bin/plugins/get-plugins');
  util.request('https://local.whistlejs.com/cgi-bin/rules/list');
  util.request('https://local.whistlejs.com/whistle.test');
  util.request('http://local.whistlejs.com/whistle.test');
  util.request('https://local.whistlejs.com/plugin.test');
  util.request('http://local.whistlejs.com/plugin.test');
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/log/get',
    headers: {
      origin: 'http://wproxy.org'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/values/add',
    method: 'post',
    form: {
      name: 'test',
      value: '123'
    }
  }, function() {
    util.request({
      url: 'http://local.whistlejs.com/cgi-bin/values/rename',
      method: 'post',
      form: {
        name: 'test',
        newName: '123'
      }
    }, function() {
      util.request({
        url: 'http://local.whistlejs.com/cgi-bin/values/remove',
        method: 'post',
        form: {
          name: '123'
        }
      });
    });
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/values/move-to',
    method: 'post',
    form: {
      to: 'test',
      from: 'abc'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/add',
    method: 'post',
    form: {
      name: 'test',
      value: '/test/ file://xxx'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/enable-default',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/remove',
    method: 'post',
    form: {
      name: 'test',
      value: '/test/ file://xxx'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/rename',
    method: 'post',
    form: {
      name: 'test',
      newName: 'sssss'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/select',
    method: 'post',
    form: {
      name: 'test'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/unselect',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/allow-multiple-choice',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/log/set',
    method: 'get',
    form: {
      level: 'error',
      text: 'teset error log'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/composer',
    method: 'post',
    form: {
      url: 'http://test.whistlejs.com/'
    }
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/intercept-https-connects',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/hide-https-connects',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/do-not-show-again',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/check-update',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/move-to',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistlejs.com/cgi-bin/rules/get-sys-hosts',
    method: 'post'
  });


  util.request('http://local.wproxy.org:1234/index.html?doNotParseJson');
  util.request('http://local.wproxy.org:1234/index.html?doNotParseJson');
  util.request('http://local.wproxy.org:1234/cgi-bin/log/get');
  util.request('http://local.wproxy.org:1234/cgi-bin/init');
  util.request('http://local.wproxy.org:1234/cgi-bin/get-data');
  util.request('http://local.wproxy.org:1234/cgi-bin/server-info');
  util.request('http://local.wproxy.org:1234/cgi-bin/values/list');
  util.request('http://local.wproxy.org:1234/cgi-bin/plugins/get-plugins');
  util.request('http://local.wproxy.org:1234/cgi-bin/rules/list');

  util.request('https://local.wproxy.org:1234/index.html?doNotParseJson');
  util.request('https://local.wproxy.org:1234/index.html?doNotParseJson');
  util.request('https://local.wproxy.org:1234/cgi-bin/log/get');
  util.request('https://local.wproxy.org:1234/cgi-bin/init');
  util.request('https://local.wproxy.org:1234/cgi-bin/get-data');
  util.request('https://local.wproxy.org:1234/cgi-bin/server-info');
  util.request('https://local.wproxy.org:1234/cgi-bin/values/list');
  util.request('https://local.wproxy.org:1234/cgi-bin/plugins/get-plugins');
  util.request('https://local.wproxy.org:1234/cgi-bin/rules/list');
  util.request('https://local.wproxy.org:1234/whistle.test');
  util.request('http://local.wproxy.org:1234/whistle.test');
  util.request('https://local.wproxy.org:1234/plugin.test');
  util.request('http://local.wproxy.org:1234/plugin.test');
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/values/add',
    method: 'post',
    form: {
      name: 'test',
      value: '123'
    }
  }, function() {
    util.request({
      url: 'http://local.wproxy.org:1234/cgi-bin/values/rename',
      method: 'post',
      form: {
        name: 'test',
        newName: '123'
      }
    }, function() {
      util.request({
        url: 'http://local.wproxy.org:1234/cgi-bin/values/remove',
        method: 'post',
        form: {
          name: '123'
        }
      });
    });
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/values/move-to',
    method: 'post',
    form: {
      to: 'test',
      from: 'abc'
    }
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/add',
    method: 'post',
    form: {
      name: 'test',
      value: '/test/ file://xxx'
    }
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/enable-default',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/remove',
    method: 'post',
    form: {
      name: 'test',
      value: '/test/ file://xxx'
    }
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/rename',
    method: 'post',
    form: {
      name: 'test',
      newName: 'sssss'
    }
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/select',
    method: 'post',
    form: {
      name: 'test'
    }
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/unselect',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/allow-multiple-choice',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/log/set',
    method: 'get',
    form: {
      level: 'warn',
      text: 'teset warn log'
    }
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/composer',
    method: 'post',
    form: {
      url: 'http://test.whistlejs.com/'
    }
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/intercept-https-connects',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/hide-https-connects',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/do-not-show-again',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/check-update',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/move-to',
    method: 'post'
  });
  util.request({
    url: 'http://local.wproxy.org:1234/cgi-bin/rules/get-sys-hosts',
    method: 'post'
  });


  util.request('http://local.whistle.com/index.html?doNotParseJson');
  util.request('http://local.whistle.com:1234/index.html?doNotParseJson');
  util.request('http://local.whistle.com/cgi-bin/log/get');
  util.request('http://local.whistle.com/cgi-bin/init');
  util.request('http://local.whistle.com:2345/cgi-bin/init');
  util.request('http://local.whistle.com/cgi-bin/get-data');
  util.request('http://local.whistle.com/cgi-bin/server-info');
  util.request('http://local.whistle.com/cgi-bin/values/list');
  util.request('http://local.whistle.com/cgi-bin/plugins/get-plugins');
  util.request('http://local.whistle.com/cgi-bin/rules/list');

  util.request('https://local.whistle.com/index.html?doNotParseJson');
  util.request('https://local.whistle.com:1234/index.html?doNotParseJson');
  util.request('https://local.whistle.com/cgi-bin/log/get');
  util.request('https://local.whistle.com/cgi-bin/init');
  util.request('https://local.whistle.com:2345/cgi-bin/init');
  util.request('https://local.whistle.com/cgi-bin/get-data');
  util.request('https://local.whistle.com/cgi-bin/server-info');
  util.request('https://local.whistle.com/cgi-bin/values/list');
  util.request('https://local.whistle.com/cgi-bin/plugins/get-plugins');
  util.request('https://local.whistle.com/cgi-bin/rules/list');
  util.request('https://local.whistle.com/whistle.test');
  util.request('http://local.whistle.com/whistle.test');
  util.request('https://local.whistle.com/plugin.test');
  util.request('http://local.whistle.com/plugin.test');
  util.request({
    url: 'http://local.whistle.com/cgi-bin/values/add',
    method: 'post',
    form: {
      name: 'test',
      value: '123'
    }
  }, function() {
    util.request({
      url: 'http://local.whistle.com/cgi-bin/values/rename',
      method: 'post',
      form: {
        name: 'test',
        newName: '123'
      }
    }, function() {
      util.request({
        url: 'http://local.whistle.com/cgi-bin/values/remove',
        method: 'post',
        form: {
          name: '123'
        }
      });
    });
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/values/move-to',
    method: 'post',
    form: {
      to: 'test',
      from: 'abc'
    }
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/add',
    method: 'post',
    form: {
      name: 'test',
      value: '/test/ file://xxx'
    }
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/enable-default',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/remove',
    method: 'post',
    form: {
      name: 'test',
      value: '/test/ file://xxx'
    }
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/rename',
    method: 'post',
    form: {
      name: 'test',
      newName: 'sssss'
    }
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/select',
    method: 'post',
    form: {
      name: 'test'
    }
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/unselect',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/allow-multiple-choice',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/log/set',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/composer',
    method: 'post',
    form: {
      url: 'http://test.whistlejs.com/'
    }
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/intercept-https-connects',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/hide-https-connects',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/do-not-show-again',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/check-update',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/move-to',
    method: 'post'
  });
  util.request({
    url: 'http://local.whistle.com/cgi-bin/rules/get-sys-hosts',
    method: 'post'
  });

  var mockUrl = 'http://mock.remote-key2.test.w2.org/test/path?doNotParseJson';
  var serviceUrl = 'http://service.remote-key2.test.w2.org/test/path?doNotParseJson';
  var shadowUrl = 'http://shadow.remote-key2.test.w2.org/test/path?doNotParseJson';

  util.request('http://mock.remote-key.test.w2.org/test/path?doNotParseJson', function(_, data) {
    data.should.equal('mock');
  });
  util.request('http://service.remote-key.test.w2.org/test/path?doNotParseJson', function(_, data) {
    data.should.equal('service');
  });
  util.request('http://shadow.remote-key.test.w2.org/test/path?doNotParseJson', function(_, data) {
    data.should.equal('shadow');
  });
  util.request(mockUrl, function(_, data) {
    data.should.equal(mockUrl + 'mock123');
  });
  util.request(serviceUrl, function(_, data) {
    data.should.equal(serviceUrl + 'service123');
  });
  util.request(shadowUrl, function(_, data) {
    data.should.equal(shadowUrl + 'shadow123');
  });

  ['shadow', 'service', 'mock'].forEach(function(name) {
    util.request({
      url: 'http://' + name + '.remote-key3.test.w2.org/test/script/api',
      headers: { test: 'abc' }
    }, function(res, data) {
      data.url.should.containEql('api');
    });

    util.request({
      url: 'http://' + name + '.remote-key4.test.w2.org/test/script/proxy',
      headers: { test: 'abc' }
    }, function(res, data) {
      data.url.should.containEql('proxy');
    });
  });
};
