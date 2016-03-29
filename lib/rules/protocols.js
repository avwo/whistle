var protocols = ['host', 'req', 'rule', 'res', 'weinre', 'filter', 'disable', 'log', 'exports', 'exportsUrl', 'referer', 'auth', 'ua', 'etag',  
                 'urlParams', 'dispatch', 'params', 'statusCode', 'redirect', 'method', 'cache', 'attachment', 'accept', 'reqDelay', 'resDelay', 'reqSpeed', 
                 'resSpeed', 'reqType', 'resType', 'reqCharset', 'resCharset', 'reqCookies', 'resCookies', 'reqCors', 'resCors', 'reqHeaders', 'resHeaders', 
                 'reqPrepend', 'resPrepend', 'reqBody', 'resBody', 'reqAppend', 'resAppend', 'head', 'reqReplace', 'resReplace', 'reqWrite',  
                 'resWrite', 'reqWriteRaw', 'resWriteRaw', 'css', 'html', 'js'];

exports.protocols = protocols;

function getRules() {
	return resetRules({});
}

exports.getRules = getRules;

function resetRules(rules) {
	protocols.forEach(function(protocol) {
		rules[protocol] = [];
	});
	return rules;
}

exports.resetRules = resetRules;

function contains(name) {
	return protocols.indexOf(name) != -1;
}

exports.contains = contains;