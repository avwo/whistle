var util = require('../util.test');

module.exports = function() {
	util.request('http://values1.avenwu.com/index.html', function(res, data) {
		res.headers.should.have.property('x-res-test', 'res');
		data.should.have.property('abc', 123);
	});
	
	util.request('http://values2.test.com/index.html', function(res, data) {
	  res.headers.should.have.property('x-res-test2', 'res');
    data.headers.should.have.property('x-req-test', 'req');
  });
};