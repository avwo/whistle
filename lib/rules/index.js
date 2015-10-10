var util = require('../util');
var values = require('./util').values;
var url = require('url');
var net = require('net');
var lookup = require('./dns');
var extend = require('util')._extend;
var allowDnsCache = true;
var protocols = ['host', 'req', 'rule', 'res', 'weinre', 'filter', 'log', 'referer', 'auth', 'ua', 'urlParams', 'params', 'statusCode', 'redirect', 'method', 'cache', 
                 'reqDelay', 'resDelay', 'reqSpeed', 'resSpeed', 'reqType', 'resType', 'reqCookies', 'resCookies', 'reqCors', 'resCors', 
                 'reqHeaders', 'resHeaders', 'reqPrepend', 'resPrepend', 'reqBody', 'resBody', 'reqAppend', 'resAppend', 'head', 'reqTransform', 
                 'resTransform', 'reqT', 'resT'];
var rules = {};
protocols.forEach(function(protocol) {
	rules[protocol] = [];
});

function parse(text) {
	protocols.forEach(function(protocol) {
		rules[protocol] = [];
	});
	if (!text || !(text = text.trim())) {
		return;
	}
	
	text.split(/\n|\r\n|\r/g).forEach(pareLine);
}

function pareLine(line) {
	var raw = line;
	line = line.replace(/#.*$/, '').trim();
	if (!line) {
		return;
	}
	
	line = line.split(/\s+/);
	var pattern = line[0];
	if (net.isIP(pattern) || (util.hasProtocol(pattern) && !/^(?:http|ws)s?:\/\//.test(pattern))) {
		line.slice(1).forEach(function(matcher) {
			parseRule(matcher, pattern, raw);
		});
	} else if (!util.isRegExp(pattern) && util.isRegExp(line[1])) {
		parseRule(line[1], pattern, raw);
	} else {
		parseRule(pattern, line[1], raw);
	}
}

function parseRule(pattern, matcher, raw) {
	var isRegExp;
	var rawPattern = pattern;
	if (!pattern || !matcher || 
			((isRegExp = util.isRegExp(pattern)) && !(pattern = util.toRegExp(pattern)))) {
		return;
	}
	
	var list;
	if (net.isIP(matcher)) {
		list = rules.host;
	} else {
		var protocol = matcher.match(/^([\w\-]+):\/\//);
		list = rules[protocol && protocol[1]] || rules.rule;
	}
	
	list.push({
		isRegExp: isRegExp,
		protocol: isRegExp ? null : util.getProtocol(pattern),
		pattern: isRegExp ? pattern : formatUrl(pattern),
		matcher: matcher,
		raw: raw,
		isDomain: !isRegExp && util.removeProtocol(rawPattern, true).indexOf('/') == -1,
		rawPattern: rawPattern
	});
}

exports.parse = parse;

function resolveHost(_url, callback) {
	_url = formatUrl(util.setProtocol(_url));
	var options = url.parse(_url);
	if (!options.hostname || (!util.isWebsocketProtocol(options.protocol) 
			&& !util.isWebProtocol(options.protocol))) {
		
		return callback(null, null);
	}
	
	var host = !resolveFilter(_url).host && getRule(_url, rules.host);
	host ? callback(null, host.matcher) 
			: lookup(options.hostname, callback, allowDnsCache);
}

function formatUrl(pattern) {
	var queryString = '';
	var queryIndex = pattern.indexOf('?');
	if (queryIndex != -1) {
		queryString = pattern.substring(queryIndex);
		pattern = pattern.substring(0, queryIndex);
	}
	return (pattern.indexOf('/', util.getProtocol(pattern) == null ? 0 : pattern.indexOf('://') + 3) == -1 ? 
			pattern + '/' : pattern) + queryString;
}

exports.resolveHost = resolveHost;


function getRule(url, list) {
	var rule = _getRule(url, list);
	//支持域名匹配
	if (!rule && (rule = _getRule(url.replace(/^((?:http|ws)s?:\/\/[^\/]+):\d*(\/.*)/i, '$1$2'), list))
			&& !rule.isDomain) {
		rule = null;
	}
	if (rule) {
		url = rule.url;
		var index = url.indexOf('://') + 3;
		var protocol = url.substring(0, index);
		url = url.substring(index);
		var key = getKey(url);
		if (key) {
			rule.key = key;
		}
		var value = key && values.get(key);
		if (value == null) {
			value = false;
		}
		if (value !== false || (value = getValue(url)) !== false) {
			rule.value = protocol + value;
		} else if ((value = getPath(url)) !== false) {
			rule.path = protocol + value;
			rule.files = getFiles(rule.path);
		}
	}
	
	return rule;
}

function getKey(url) {
	if (url.indexOf('{') == 0) {
		var index = url.lastIndexOf('}');
		return index > 1 && url.substring(1, index);
	}
	
	return false;
}

function getValue(url) {
	if (url.indexOf('(') == 0) {
		var index = url.lastIndexOf(')');
		return index != -1 && url.substring(1, index) || '';
	}
	
	return false;
}

function getPath(url) {
	if (url.indexOf('<') == 0) {
		var index = url.lastIndexOf('>');
		return index != -1 && url.substring(1, index) || '';
	}
	
	return false;
}

function _getRule(url, list) {
	if (util.removeProtocol(url, true).indexOf('/') == -1) {
		url += '/';
	}
	
	var _url = url.replace(/[?#].*$/, '');
	for (var i = 0, rule; rule = list[i]; i++) {
		var pattern = rule.pattern;
		var matcher = setProtocol(rule.matcher, url);
		var files = getFiles(matcher);
		if (rule.isRegExp) {
			if (pattern.test(url)) {
				var regExp = {};
				for (var i = 1; i < 10; i++) {
					regExp['$' + i] = RegExp['$' + i] || '';
				}
				
				function replaceSubMatcher(url) {
					return url.replace(/(^|.)?(\$[1-9])/g, 
							function(matched, $1, $2) {
						return $1 == '\\' ? $2 : ($1 || '') + regExp[$2];
					});
				}
				
				return extend({
					url: replaceSubMatcher(matcher),
					files: files && files.map(function(file) {
						return replaceSubMatcher(file);
					})
				}, rule);;
			}
		} else if (url.indexOf(pattern = setProtocol(pattern, url)) === 0) {
			var len = pattern.length;
			var hasQuery = pattern.indexOf('?') != -1;
			if (hasQuery || pattern == _url || isPathSeparator(_url[len]) || isPathSeparator(pattern[len - 1])) {
				var filePath = url.substring(len);
				if (hasQuery && filePath) {
					filePath = '?' + filePath;
				}
				return extend({
					files: files && files.map(function(file) {
						return join(file, filePath);
					}),
					url: join(matcher, filePath)
				}, rule);
			}
		}
	}
}

function getFiles(path) {
	
	return /^x?(file|tpl|jsonp|dust):/.test(path) ? util.removeProtocol(path, true).split('|') : null;
}

function setProtocol(target, source) {
	if (util.hasProtocol(target)) {
		return target;
	}
	
	var protocol = util.getProtocol(source);
	if (protocol == null) {
		return target;
	}
	
	return protocol + '//' + target;
}

function isPathSeparator(ch) {
	return ch == '/' || ch == '\\' || ch == '?';
}

/**
 * first: xxxx, xxxx?, xxx?xxxx
 * second: ?xxx, xxx?xxxx
 * @param first
 * @param second
 * @returns
 */
function join(first, second) {
	if (!first || !second) {
		return first + second;
	}
	
	var firstIndex = first.indexOf('?');
	var secondIndex = second.indexOf('?');
	var firstQuery = '';
	var secondQuery = '';
	
	if (firstIndex != -1) {
		firstQuery = first.substring(firstIndex);
		first = first.substring(0, firstIndex);
	}
	
	if (secondIndex != -1) {
		secondQuery = second.substring(secondIndex);
		second = second.substring(0, secondIndex);
	}
	
	var query = firstQuery && secondQuery ? firstQuery + secondQuery.substring(1) : (firstQuery || secondQuery);
	var url;
	var lastIndex = first.length - 1;
	var startWithSep = isPathSeparator(second[0]);
	if (isPathSeparator(first[lastIndex])) {
		url = startWithSep ? first.substring(0, lastIndex) + second : first + second;
	} else {
		url = first + (startWithSep ? '' : '/') + second;
	}
	
	return url + query; 
}


function resolveFilter(url) {
	var filter = getRule(url, rules.filter);
	var result = {};
	if (filter) {
		util.getMatcherValue(filter)
				.split('|').forEach(function(action) {
			result[action] = true;
		});
	}
	
	return result;
}

exports.resolveFilter = resolveFilter;

exports.resolveRules = function resolveRules(url) {
	url = formatUrl(util.setProtocol(url));

	var rule;
	var _rules = {};
	var filter = resolveFilter(url);
	protocols.forEach(function(protocol) {
		if (protocol != 'filter' && !filter[protocol] && (rule = getRule(url, rules[protocol]))) {
			_rules[protocol] = rule;
		}
	});
	
	return _rules;
};

exports.disableDnsCache = function() {
	allowDnsCache = false;
};
