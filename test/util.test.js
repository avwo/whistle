var config = require('./config.test');
var request = require('request').defaults({
	proxy : 'http://127.0.0.1:' + config.port
});
var count = 0;

exports.request = function(options, callback) {
	if (typeof options == 'string') {
		options = {
				url: options,
				rejectUnauthorized : false
		};
	}
	++count;
	request(options, function(err, res, body) {
		callback && callback(res, /\?resBody=/.test(options.url) ? body : (/doNotParseJson/.test(options.url) ? body : JSON.parse(body)), err);
		if (--count <= 0) {
			process.exit(0);
		}
	});
};

function noop() {}

exports.noop = noop;

function getTextBySize(size) {
	
	return new Array(size + 1).join('1');
}

exports.getTextBySize = getTextBySize;