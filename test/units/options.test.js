var util = require('../util.test');

module.exports = function() {
  util.request('http://test.options.com/index.html', function(res, data) {
    data.method.should.equal('options');
  });
};
