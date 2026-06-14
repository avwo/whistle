var util = require('../util.test');

module.exports = function() {
  util.request('http://host.test.whistlejs.com/index.html', function(res, data) {
    data.should.have.property('type', 'server');
  });
  util.request('http://127.0.0.1:18080/xhost.html', function(res, data) {
    data.should.have.property('type', 'server');
  });
};
