
module.exports = function init(proxy) {
	var config = proxy.config;
	require(require('../util').resolvePath(config.uipath) || './webui/app')(proxy);
	require('./weinre/app')(config);
};