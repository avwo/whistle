var util = require('./util.test');

module.exports = function() {
	var now = Date.now();
	util.request({
		url: 'http://reqSpeed.test.whistlejs.com/',
		body: util.getTextBySize(128 * 3 + 1)
	}, function(res, data) {
		now = Date.now() - now;
		console.log(now, data);
		//now.should.above(3000);
	});
};