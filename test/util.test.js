var config = require('./config.test');
var request = require('request').defaults({
	proxy : 'http://127.0.0.1:' + config.port
});
var count = 0;

request({
	rejectUnauthorized : false,
	url : 'https://test.whistlejs.com/'
}, function(error, response, body) {
	if (!error && response.statusCode == 200) {
		console.log(body) // Show the HTML for the Google homepage.
	}
});

exports.request = function(options, callback) {
	if (typeof options == 'string') {
		options = {
				url: options,
				rejectUnauthorized : false
		};
	}
	++count;
	request(options, function(err, res, body) {
		if (err || res.statusCode != 200) {
			process.exit(10);
			return;
		}
		
		callback && callback(body);
		if (--count <= 0) {
			process.exit(0);
		}
	});
};