var util = require('../../util');
var enxtend = require('util')._extend;
var WhistleTransform = util.WhistleTransform;

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
	} else {
		delete headers['accept-encoding'];
	}
}

/**
 * 处理请求数据
 * 
 * @param req：method、body、headers，top，bottom，speed、delay，charset,timeout
 * @param data
 */
function handleReq(req, data) {
	if (!data) {
		return;
	}
	
	req.rules.req.value = data;
	req.add(new WhistleTransform(data));
	req.method = data.method || req.method;
	req.timeout = data.timeout;
	enxtend(req.headers, data.headers);
}

module.exports = function(req, res, next) {
	util.parseFileToJson(req.rules.req && req.rules.req.url, 
			function(err, data) {
		handleReq(req, data);
		removeUnsupportsHeaders(req.headers);
		next();
	});
};