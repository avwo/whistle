var util = require('../util.test');

module.exports = function() {
  util.request('https://tp.w2.org/index.html?doNotParseJson', function(res, data, err) {
//    data.ruleValue.should.be.equal('global');
    console.log('get', data, err&&err.stack);
  });

  util.request({
    method: 'post',
    url: 'https://tp.w2.org/index.html?doNotParseJson',
    isTunnel: true
  }, function(res, data, err) {
//    data.body.should.be.equal('test');
    console.log('post', data, err&&err.stack);
  });
};
