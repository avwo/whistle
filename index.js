var util = require('./lib/util');

module.exports = function init(options) {
	return require('./lib')(options || {});
};