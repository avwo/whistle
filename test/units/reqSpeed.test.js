var util = require('../util.test');

module.exports = function() {
  var now = Date.now();
  util.request({
    url: 'http://reqspeed.test.whistlejs.com/',
    method: 'post',
    body: util.getTextBySize(128 * 2 + 1)
  }, function(res, data) {
    now = Date.now() - now;
    now.should.above(2000);
  });
};
