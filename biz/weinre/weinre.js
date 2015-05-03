var config = require('../../util').config;
var weinre = require('weinre');

weinre.run({
	boundHost: config.WEINRE_HOST,
	httpPort: config.weinreport
});