
module.exports = function init(proxy) {
	var config = proxy.config;
	require(config.uipath)(proxy);
	require('./weinre/app')(config);
};