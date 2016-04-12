var protocols = ['host', 'req', 'rule', 'res', 'weinre', 'filter', 'disable', 'log', 'exports', 'exportsUrl', 'referer', 'auth', 'ua', 'etag',  
                 'urlParams', 'dispatch', 'params', 'statusCode', 'redirect', 'method', 'cache', 'attachment', 'accept', 'reqDelay', 'resDelay', 'reqSpeed', 
                 'resSpeed', 'reqType', 'resType', 'reqCharset', 'resCharset', 'reqCookies', 'resCookies', 'reqCors', 'resCors', 'reqHeaders', 'resHeaders', 
                 'reqPrepend', 'resPrepend', 'reqBody', 'resBody', 'reqAppend', 'resAppend', 'head', 'reqReplace', 'resReplace', 'reqWrite',  
                 'resWrite', 'reqWriteRaw', 'resWriteRaw', 'css', 'html', 'js'];
var webProtocols = ['http', 'https', 'ws', 'wss'];

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
	return webProtocols.indexOf(name) != -1 || protocols.indexOf(name) != -1;
}

exports.contains = contains;