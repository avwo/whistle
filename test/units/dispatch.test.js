var util = require('../util.test');

module.exports = function() {
	util.request('http://dispatch.test.whistlejs.com/index.html', function(res, data) {
		data.url.should.containEql('dispatch=test');
		data.url.should.containEql('timestamp=');
		data.should.have.property('host', '127.0.0.1');
		data.should.have.property('port', '8080');
	});
	
	util.request({
		url: 'https://dispatch.test.whistlejs.com/index.html',
		method: 'post',
		body: 'sssssss'
	}, function(res, data) {
		data.url.should.containEql('dispatch=test');
		data.url.should.containEql('timestamp=');
		data.should.have.property('host', '127.0.0.1');
		data.should.have.property('port', '8080');
	});
};