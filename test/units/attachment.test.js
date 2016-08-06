var util = require('../util.test');

module.exports = function() {
	util.request('http://attachment.test.whistlejs.com/index.html', function(res, data) {
		res.headers.should.have.property('content-disposition', 'attachment; filename="index.html"');
	});
	
	util.request({
		method: 'put',
		url: 'https://attachment.test.whistlejs.com/index2.html'
	}, function(res, data) {
		res.headers.should.have.property('content-disposition', 'attachment; filename="index2.html"');
	});
};