module.exports = function init(options, callback) {
	require('./lib/config').extend(options);
	return require('./lib')(callback);
};