
module.exports = function init(app) {
	require(app.uipath || './webui/app')(app);
	require('./weinre/app')(app);
};