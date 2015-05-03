var config = require('../../util').config;
var weinre = require('weinre');
weinre.run({
	boundHost: process.argv[3],
	httpPort: process.argv[5]
});