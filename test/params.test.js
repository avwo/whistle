var util = require('./util.test');

module.exports = function() {
	util.request({
		url: 'http://params.test.whistlejs.com/index.html',
		method: 'POST',
		form: {key: 'value'}
	}, function(res, data) {
		data.body.should.equal('key=value&test=abc');
	});
};