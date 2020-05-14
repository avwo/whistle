var util = require('../util.test');

module.exports = function() {
  util.request({
    url: 'http://statuscode1.testx.whistlejs.com/index.html?resBody=',
    method: 'POST',
    body: 'xxxxxxxxxxxx'
  }, function(res) {
    res.statusCode.should.equal(999);
  });

  util.request('https://statuscode2.testx.whistlejs.com/index.html?resBody=', function(res) {
    res.statusCode.should.equal(101);
  });

  util.request('http://statuscode3.testx.whistlejs.com/index.html?resBody=', function(res) {
    res.statusCode.should.equal(500);
  });

  util.request({
    url: 'http://statuscode4.test.whistlejs.com/index.html?resBody=',
    method: 'POST',
    body: 'xxxxxxxxxxxx'
  }, function(res, body, err) {
    err.should.be.ok();
  });

  util.request('https://statuscode5.test.whistlejs.com/index.html?resBody=', function(res, body, err) {
    err.should.be.ok();
  });
};
