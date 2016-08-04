var util = require('./util.test');

module.exports = function() {
	util.request('http://urlparams.test.whistlejs.com/index.html', function(res, data) {
		/\?test=abc/.test(data.url).should.be.true();
	});
};