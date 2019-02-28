var util = require('../util.test');

module.exports = function() {
  // util.request('http://weinre1.test2.whistlejs.com/index.html?resBody=_', function(res, body) {
  //   body.should.containEql('http://local.whistlejs.com/...whistle-path.5b6af7b9884e1165...///weinre.6668/target/target-script-min.js#xxx');
  // });
  util.request('http://weinre1.test.whistlejs.com/index.html?resBody=_', function(res, body) {
    body.should.containEql('/target/target-script-min.js#xxx');
  });
  util.request({
    url: 'http://weinre2.test.whistlejs.com/index.html',
    method: 'post',
    body: 'sssssss'
  });

  util.request('https://weinre3.test.whistlejs.com/index.html');

  util.request({
    url: 'https://weinre4.test.whistlejs.com/index.html',
    method: 'post',
    body: 'sssssss'
  });

  // util.request('https://weinre1.test2.whistlejs.com:1234/index.html?resBody=_', function(res, body) {
  //   body.should.containEql('https://local.whistlejs.com/...whistle-path.5b6af7b9884e1165...///weinre.6668/target/target-script-min.js#xxx');
  // });
  util.request('https://weinre1.test.whistlejs.com:1234/index.html?resBody=_', function(res, body) {
    body.should.containEql('/target/target-script-min.js#xxx');
  });

  util.request({
    url: 'http://weinre2.test.whistlejs.com:2345/index.html',
    method: 'post',
    body: 'sssssss'
  });

  util.request('https://weinre3.test.whistlejs.com:3456/index.html');

  util.request({
    url: 'https://weinre4.test.whistlejs.com:4567/index.html',
    method: 'post',
    body: 'sssssss'
  });
};
