var util = require('../util.test');

module.exports = function() {
	util.request('http://pac.test.com/index.html', function(res, data) {
	  data.should.be.have.property('type', 'server');
	});
};