var request = require('request').defaults({
	proxy : 'http://127.0.0.1:8888'
});

request({
	rejectUnauthorized : false,
	url : 'https://test.whistlejs.com/'
}, function(error, response, body) {
	if (!error && response.statusCode == 200) {
		console.log(body) // Show the HTML for the Google homepage.
	}
});