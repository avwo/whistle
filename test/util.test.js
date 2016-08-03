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
		if (err) {
			console.error(err.stack);
			process.exit(1);
			return;
		}
		
		callback && callback(res, res.statusCode == 200 ? JSON.parse(body) : null);
		if (--count <= 0) {
			process.exit(0);
		}
	});
};

function noop() {}

exports.noop = noop;