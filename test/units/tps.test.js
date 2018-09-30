var util = require('../util.test');

module.exports = function() {
  util.request({
    url: 'http://1.tps.whistlejs.com/index.html?name=tps1.json',
    headers: {
      'x-test': 'test',
      cookie: 'cookieName=123; test=abc',
      other: 'otherhaha'
    }
  }, function(res, data) {
    data.cookieValue.should.equal('123');
  });

  util.request({
    method: 'post',
    headers: {
      'x-test': 'test',
      cookie: 'cookieName=123; test=abc; name=tps2.json',
      other: 'otherhaha'
    },
    url: 'https://2.tps.whistlejs.com/?test=abc'
  }, function(res, data) {
    data.statusCode.should.equal('200');
  });
};
