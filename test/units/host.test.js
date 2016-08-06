var util = require('../util.test');

module.exports = function() {
	util.request('http://host.test.whistlejs.com/index.html', function(res, data) {
		data.should.have.property('type', 'server');
	});
};