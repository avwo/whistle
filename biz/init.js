
module.exports = function init(proxy) {
	var config = proxy.config;
	require(config.uipath || './webui/app')(proxy);
	require('./weinre/app')(config);
};