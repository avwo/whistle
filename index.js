module.exports = require('./lib');
module.exports.run = function(options) {
	var program = require('./bin/cmd');
	return program;
};