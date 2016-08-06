var util = require('../util.test');

module.exports = function() {
	var body = 'test__';
	util.request({
		url: 'http://test.whistlejs.com/',
		body: body
	}, function(res, data) {
		data.body.should.be.equal(body);
	});
};