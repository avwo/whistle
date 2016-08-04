var util = require('./util.test');

module.exports = function() {
	var now = Date.now();
	util.request('http://resdelay.test.whistlejs.com/', function(res, data) {
		now = Date.now() - now;
		now.should.above(1000);
	});
};