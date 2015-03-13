var util = require('../util/util');
var url = require('url');
var net = require('net');
var dns = require('dns');
var extend = require('util')._extend;

var rules = [];
var hosts = [];

function parse(_hosts) {
	rules = [];
	hosts = [];
	if (_hosts) {
		_hosts.trim().split(/\r\n|\n|\r/g).forEach(parseHost);
	}
}

function parseHost(host) {
	host = host.replace(/#.*$/, '').trim().split(/\s+/);
	var pattern = host[0] && host[0].trim();
	var matcher = host[1] && host[1].trim();
	
	if (!pattern || !matcher) {
		return;
	}
	
	if (net.isIP(pattern) || util.isRegExp(matcher) || !/http:\/\//.test(util.setProtocol(pattern))) {
		var tmp = pattern;
		pattern = matcher;
		matcher = tmp;
	}
	
	var isIP = net.isIP(matcher);
	var isRegExp = util.isRegExp(pattern);
	if (!isRegExp) {
		pattern = pattern.toLowerCase();
		if (!isIP) {
			pattern = util.setProtocol(pattern);
			if (pattern.substring(pattern.indexOf('://') + 3).indexOf('/') == -1) {
				pattern += '/';
			}
		} else if (!(pattern = util.getHost(pattern))) {
			return;
		}
	} else if (!(pattern = util.toRegExp(pattern))) {
		return;
	}
	
	(isIP ? hosts : rules).push({
		isRegExp: isRegExp,
		pattern: pattern,
		matcher: isIP ? matcher : util.setProtocol(matcher)
	});
}

exports.parse = parse;

function resolve(_url, callback) {
	var rule = {};
	var matchedUrl = resolveRule(_url.toLowerCase(), rule);
	var hosts = [];
	var error, done;
	var matcher = matchedUrl || _url;
	var options = url.parse(matcher);
	options.url = matcher;
	options.rule = rule;
	options.hasMatcher = !!matchedUrl;

	if (matchedUrl) {
		resolveHost(matchedUrl, function(err, ip) {
			hosts[1] = ip;
			error = err;
			execCallback();
		});
		
		hosts[0] = null;
		execCallback();
	} else {
		resolveHost(_url, function(err, ip) {
			hosts[0] = ip;
			if (!matchedUrl) {
				hosts[1] = ip;
				error = err;
			}
			execCallback();
		});
	}
	
	function execCallback() {
		if (!done && (error || (typeof hosts[0] != 'undefined' && typeof hosts[1] != 'undefined'))) {
			done = true;
			options.hosts = hosts;
			hosts[1] = hosts[1] || hosts[0];
			hosts[0] = hosts[0] || hosts[1];
			callback(error, options);
		}
	}
}

exports.resolve = resolve;

function resolveHost(_url, callback) {
	var options = _url ? url.parse(util.setProtocol(_url.toLowerCase())) : {};
	if (!util.isWebProtocol(options.protocol)) {
		callback(null, null);
		return;
	}
	var hostname = options.hostname;
	for (var i = 0, host; host = hosts[i]; i++) {
		if (host.isRegExp ? host.pattern.test(_url) : hostname == host.pattern) {
			callback(null, host.matcher);
			return;
		}
	}
	
	try {
		dns.lookup(hostname, function(err, ip, addressType) {
		      callback(err, err ? null : (ip || (!addressType || addressType === 4 ? '127.0.0.1' : '0:0:0:0:0:0:0:1')));
		  });
	} catch(err) {//如果断网，可能直接抛异常，https代理没有用到error-handler
		callback(err);
	}
}

exports.resolveHost = resolveHost;

function resolveRule(url, data) {
	data = data || {};
	for (var i = 0, rule; rule = rules[i]; i++) {
		if (rule.isRegExp) {
			if (rule.pattern.test(url)) {
				var regExp = {};
				for (var i = 0; i < 10; i++) {
					regExp['$' + i] = RegExp['$' + i] || '';
				}
				extend(data, rule);
				return rule.matcher.replace(/(^|.)?(\$[1-9])/g, 
						function(matched, $1, $2) {
					return $1 == '\\' ? $2 : ($1 || '') + regExp[$2];
				});
			}
		} else if (url.indexOf(rule.pattern) === 0) {
			var len = rule.pattern.length;
			if (rule.pattern == url || isPathSeparator(url[len]) || isPathSeparator(rule.pattern[len - 1])) {
				extend(data, rule);
				return join(rule.matcher, url.substring(len));
			}
		}
	}
}

exports.resolveRule = resolveRule;

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

