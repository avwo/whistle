var config = require('../../util').config;
var weinre = require('weinre');

module.exports = function init(app) {
	weinre.run({
		boundHost: 'localhost',
		httpPort: parseInt(app.weinreport, 10),
		verbose: false,
		debug: false,
		readTimeout: 5,
		deathTimeout: 15
	});
};