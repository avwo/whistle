var util = require('../util.test');
var config = require('../config.test');

module.exports = function() {
	util.proxy('http://127.0.0.1:' + config.serverPort, function(res) {
		
	});
};