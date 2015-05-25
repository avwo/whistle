var start = require('./lib');
var util = require('./util');

module.exports = function init(options) {
	if (options.dataDir) {
		util.LOCAL_DATA_PATH = options.dataDir;
	}
	return start(options);
};