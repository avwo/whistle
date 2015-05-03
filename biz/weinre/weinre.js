var config = require('../../util').config;
var weinre = require('weinre');
weinre.run({
	boundHost: process.argv[3],
	httpPort: parseInt(process.argv[5]),
	verbose: false,
	debug: false,
	readTimeout: 5,
	deathTimeout: 15
});