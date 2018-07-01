var util = require('../util.test');

module.exports = function() {
  util.request('ws://connect.whistlejs.com/index.html', function(data) {
    data.type.should.equal('server');
  });

  util.request('ws://connect.whistlejs.com/index.html', function(data) {
    data.type.should.equal('server');
  });
};
