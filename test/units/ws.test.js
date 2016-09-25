var util = require('../util.test');

module.exports = function() {
	if (/^v0\.10\./.test(process.version)) {
		return;
	}
	util.request('ws://test.local.whistlejs.com/cgi-bin/rules/list', function(data) {
    data.headers.should.have.property('host', 'test.local.whistlejs.com');
  });
  util.request('wss://test.local.whistlejs.com/cgi-bin/rules/list', function(data) {
    data.headers.should.have.property('host', 'test.local.whistlejs.com');
  });
  
	util.request('ws://test.whistlejs.com/index.html', function(data) {
		data.host.should.equal('127.0.0.1');
		data.port.should.equal('8080');
	});
	
	util.request('wss://ws1.test.whistlejs.com/index.html', function(data) {
		data.host.should.equal('127.0.0.1');
		data.port.should.equal('9999');
	});
};