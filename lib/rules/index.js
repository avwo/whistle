var util = require('../util');
var rulesUtil = require('./util');
var url = require('url');
var net = require('net');
var dns = require('dns');
var Q = require('q');
var extend = require('util')._extend;
var DNS_CACHE = {};
var DNS_CACHE_TIME = 60000;
var allowDnsCache = true;
var protocols = ['host', 'rule', 'head', 'req', 'reqHeaders', 'reqBody', 'prependReq', 'appendReq', 
                 'res', 'resHeaders', 'resBody', 'prependRes', 'appendRes', 'weinre', 'filter'];
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
		rawPattern: pattern
	});
}

exports.parse = parse;

function resolveHost(_url, callback) {
	_url = formatUrl(util.setProtocol(_url));
	var options = url.parse(_url);
	if (!util.isWebsocketProtocol(options.protocol) && !util.isWebProtocol(options.protocol)) {
		
		return callback(null, null);
	}
	
	var _host = !resolveFilter(_url).host && getRule(_url, rules.host);
	if (_host) {
		return callback(null, _host.matcher);
	}
	
	var hostname = options.hostname;
	var promise = DNS_CACHE[hostname];
	var defer, done;
	if (!promise || (promise.time && Date.now() - promise.time > DNS_CACHE_TIME)) {
		defer = Q.defer();
		promise = DNS_CACHE[hostname] = defer.promise;
	}
	
	promise.done(function(ip) {
		callback(null, ip);
	}, callback);
	
	if (!defer) {
		return;
	}
	
	(function lookup() {
		try {
			dns.lookup(hostname, function (err, ip, addressType) {
				if (err) {
					if (!done) {
						done = true;
						lookup();
					} else {
						DNS_CACHE[hostname] = null;
						defer.reject(err);
					}
					return;
				}
				promise.time = Date.now();
				defer.resolve(ip || (!addressType || addressType === 4 ? '127.0.0.1' : '0:0:0:0:0:0:0:1'));
			  });
		} catch(err) {//如果断网，可能直接抛异常，https代理没有用到error-handler
			DNS_CACHE[hostname] = null;
			defer.reject(err);
		}
	})();
}

function formatUrl(pattern) {
	
	return pattern.indexOf('/', util.getProtocol(pattern) == null ? 0 : pattern.indexOf('://') + 3) == -1 ? 
			pattern + '/' : pattern;
}

exports.resolveHost = resolveHost;


function getRule(url, list) {
	var rule = _getRule(url, list);
	//支持域名匹配
	if (!rule && (rule = _getRule(url.replace(/^((?:http|ws)s?:\/\/[^\/]+):\d*(\/.*)/i, '$1$2'), list))
			&& util.removeProtocol(rule.rawPattern, true).indexOf('/') != -1) {
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
		var value = key && rulesUtil.getValue(key);
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
		} else {
			pattern = setProtocol(pattern, url);
			var len = pattern.length;
			if (pattern.indexOf('?') != -1 && url.indexOf(pattern) === 0) {
				var filePath = url.substring(len);
				return extend({
					url: matcher.indexOf('?') == -1 ? matcher : matcher + filePath,
					files: files && files.map(function(file) {
						return file.indexOf('?') == -1 ? file : file + filePath;
					})
				}, rule);
			}
			
			if (_url.indexOf(pattern) === 0) {
				if (pattern == _url || isPathSeparator(_url[len]) || isPathSeparator(pattern[len - 1])) {
					var filePath = url.substring(len);
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
	return ch == '/' || ch == '\\';
}

function join(first, last) {
	if (!first || !last) {
		return first + last;
	}
	
	var len = first.length - 1;
	if (isPathSeparator(first[len])) {
		return isPathSeparator(last[0]) ? first.substring(0, len) + last : first + last;
	}
	
	return isPathSeparator(last[0]) ? first + last : first + '/' + last;
}

function resolveFilter(url) {
	var filter = getRule(url, rules.filter);
	var result = {};
	if (filter) {
		util.removeProtocol(util.rule.getMatcher(filter), true)
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
