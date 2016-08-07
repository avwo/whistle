var util = require('../util.test');

module.exports = function() {
	util.request('http://test.local.whistlejs.com/index.html?doNotParseJson', function(res, body) {
		body.should.equal('uiServer');
	});
};