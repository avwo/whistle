var util = require('../util.test');

module.exports = function() {
	util.request({
		url: 'http://params.test.whistlejs.com/index.html',
		method: 'POST',
		form: {key: 'value'}
	}, function(res, data) {
		data.body.should.equal('key=value&test=abc');
	});
	
	util.request({
		url: 'http://upload.test.whistlejs.com/index.html',
		method: 'post',
		formData: {
			  name1: 'my_value',
			  file1: {
			    value:  'ok',
			    options: {
			      filename: 'topsecret.jpg',
			      contentType: 'text/plain'
			    }
			  }
		}
	}, function(res, data) {
		var body = data.body;
		data.body.should.containEql('filename=""');
		data.body.should.containEql('name="name2"');
		data.body.should.containEql('name="file2"');
		data.body.should.containEql('filename="text.txt"');
		data.body.should.containEql('1234567890');
	});
	
	util.request('http://params2.test.whistlejs.com/index.html?name=aven', function(res, data) {
		data.url.should.containEql('?name=aven&test=abc')
	});
};