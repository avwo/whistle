var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'http://test.whistlejs.com/',
		body: 'test'
	}, function(res, data) {
		if (data) {
			console.log(data.body);
		}
	});
};