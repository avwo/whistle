var iconv = require('iconv-lite');
var zlib = require('zlib');
var WHISTLE_SSL_RE = /https:\/\//ig;
var HTTPS_FLAG = require('../package.json').whistleSsl + '.';

function transform(headers, res) {
	var charset = headers['content-type'];
	if (charset && (charset = charset.split(';')[1])) {
		charset = charset.split('=')[1];
	}
	
	if (!iconv.encodingExists(charset)) {
		return res;	
	}
	
	var unzip, zip, stream, result;
	switch (headers['content-encoding']) {
	    case 'gzip':
	    	unzip = zlib.createGunzip();
	    	zip = zlib.createGzip();
	      break;
	    case 'deflate':
	    	unzip = zlib.createInflate();
	    	zip = zlib.createDeflate();
	      break;
	}
	
	
	if (unzip) {
		res = res.pipe(unzip).pipe(iconv.decodeStream(charset));
		stream = iconv.encodeStream(charset);
		result = stream.pipe(zip);
	} else {
		res = res.pipe(iconv.decodeStream(charset));
		result = stream = iconv.encodeStream(charset);
	}
	
	var rest = '';
	res.on('data', function(data) {
		var len = data.length - 7;
		if (len > 0) {
			data = (rest + data).replace(WHISTLE_SSL_RE, 'http://' + HTTPS_FLAG);
			rest = data.substring(len);
			data = data.substring(0, len);
			stream.write(data, charset);
		} else {
			rest = data;
		}
	});
	
	res.on('end', function() {
		stream.end(rest, charset);
	});
	
	return result;
}

module.exports = transform;