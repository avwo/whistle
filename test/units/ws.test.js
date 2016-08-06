var util = require('../util.test');

module.exports = function() {
	util.request('ws://test.whistlejs.com/index.html', function(data) {
		data.host.should.equal('127.0.0.1');
		data.port.should.equal('8080');
	});
	
	util.request('wss://ws1.test.whistlejs.com/index.html', function(data) {
		data.host.should.equal('127.0.0.1');
		data.port.should.equal('9999');
	});
};