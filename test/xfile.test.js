var util = require('./util.test');

module.exports = function() {
	var now = Date.now();
	util.request('http://xfile.test.whistlejs.com/index2.html', function(res, data) {
		data.should.have.property('type', 'server');
	});
};