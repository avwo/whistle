var protocols = ['host', 'req', 'rule', 'res', 'weinre', 'filter', 'disable', 'log', 'exports', 'exportsUrl', 'referer', 'auth', 'ua', 'etag',  
                 'urlParams', 'dispatch', 'params', 'statusCode', 'redirect', 'method', 'cache', 'attachment', 'accept', 'reqDelay', 'resDelay', 'reqSpeed', 
                 'resSpeed', 'reqType', 'resType', 'reqCharset', 'resCharset', 'reqCookies', 'resCookies', 'reqCors', 'resCors', 'reqHeaders', 'resHeaders', 
                 'reqPrepend', 'resPrepend', 'reqBody', 'resBody', 'reqAppend', 'resAppend', 'head', 'reqReplace', 'resReplace', 'reqWrite',  
                 'resWrite', 'reqWriteRaw', 'resWriteRaw', 'css', 'html', 'js'];
var RULE_RE = /^(?:|x|xs)(?:file|rawfile|dust|tpl|jsonp):$/;

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

function isWebProtocol(protocol) {
	return protocol == 'http:' || protocol == 'https:';
}

exports.isWebProtocol = isWebProtocol;

function isWebsocketProtocol(protocol) {
	return protocol == 'ws:' || protocol == 'wss:';
}

exports.isWebsocketProtocol = isWebsocketProtocol;

function isProxyProtocol(protocol) {
	return protocol == 'proxy:' || protocol == 'http-proxy:' || protocol == 'socks:';
}

exports.isProxyProtocol = isProxyProtocol;

function isFileProxy(protocol) {
	return RULE_RE.test(protocol);
}

exports.isFileProxy = isFileProxy;

function contains(name) {
	if (protocols.indexOf(name) != -1) {
		return true;
	}
	name += ':';
	return isWebsocketProtocol(name) || isWebProtocol(name) || isProxyProtocol(name) || isFileProxy(name);
}

exports.contains = contains;