
module.exports = function init(proxy) {
	var config = proxy.config;
	require(require('../lib/util').resolvePath(config.uipath) || './webui/app')(proxy);
	require('./weinre/app')(config);
};