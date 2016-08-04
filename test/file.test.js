var util = require('./util.test');

module.exports = function() {
	var now = Date.now();
	util.request('http://file.test.whistlejs.com/index.html', function(res, data) {
		data.should.have.property('body', 'html');
	});
};