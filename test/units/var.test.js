var util = require('../util.test');

module.exports = function() {
  util.request('http://var1.wproxy.org/index.html', function(res, data) {
    data.should.have.property('json1', 1);
    data.should.have.property('json2', 2);
    data.should.have.property('json3', 3);
  });
};
