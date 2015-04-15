module.exports = function(req, res, next) {
	
	
	removeUnsupportsHeaders(req.headers);
	next();
};

function removeUnsupportsHeaders(headers) {//只保留支持的zip格式：gzip、deflate
	if (!headers || !headers['accept-encoding']) {
		return;
	}
	var list = headers['accept-encoding'].split(/\s*,\s*/g);
	var acceptEncoding = [];
	for (var i = 0, len = list.length; i < len; i++) {
		var ae = list[i].toLowerCase();
		if (ae && (ae == 'gzip' || ae == 'deflate')) {
			acceptEncoding.push(ae);
		}
	}
	
	if (acceptEncoding = acceptEncoding.join(', ')) {
		headers['accept-encoding'] = acceptEncoding;
	}
}