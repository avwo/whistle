module.exports = function init(options) {
	require('./lib/config').extend(options);
	return require('./lib')();
};