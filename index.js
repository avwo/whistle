var util = require('./lib/util');

module.exports = function init(options) {
	options = options || {};
	if (options.dataDir) {
		util.LOCAL_DATA_PATH = options.dataDir;
	}
	return require('./lib')(options);
};