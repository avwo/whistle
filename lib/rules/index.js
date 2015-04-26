var util = require('../../util');
var url = require('url');
var net = require('net');
var dns = require('dns');
var extend = require('util')._extend;

var rules, hosts, heads, req, res, proxy;
rules = hosts = heads = req = res = proxy = [];

function parse(text) {
	rules = [];
	hosts = [];
	heads = [];
	req = [];
	res = [];
	proxy = [];
	if (!text || !(text = text.trim())) {
		return;
	}
	
	text.split(/\n|\r\n|\r/g).forEach(pareLine);
}

function pareLine(line) {
	line = line.replace(/#.*$/, '').trim();
	if (!line) {
		return;
	}
	
	line = line.split(/\s+/);
	var pattern = line[0];
	if (net.isIP(pattern) || (util.hasProtocol(pattern) && !/^https?:\/\//.test(pattern))) {
		line.slice(1).forEach(function(matcher) {
			parseRule(matcher, pattern);
		});
	} else if (!util.isRegExp(pattern) && util.isRegExp(line[1])) {
		parseRule(line[1], pattern);
	} else {
		parseRule(pattern, line[1]);
	}
}

function parseRule(pattern, matcher) {
	if (!pattern || !matcher) {
		return;
	}
	
	var isIP = net.isIP(matcher);
	var isRegExp = util.isRegExp(pattern);
	var protocol;
	if (!isRegExp) {
		protocol = util.getProtocol(pattern);
		
		if (!isIP) {
			if (pattern.indexOf('/', protocol == null ? 0 : pattern.indexOf('://') + 3) == -1) {
				pattern += '/';
			}
		} else if (!(pattern = util.getHost(pattern))) {
			return;
		}
	} else if (!(pattern = util.toRegExp(pattern))) {
		return;
	}
	
	var rule = {
			isRegExp: isRegExp,
			protocol: protocol,
			pattern: pattern,
			matcher: matcher
		};
	
	if (isIP) {
		hosts.push(rule);
	} else if (/^head:\/\//.test(matcher)) {
		heads.push(rule);
	} else if (/^req:\/\//.test(matcher)) {
		req.push(rule);
	} else if (/^res:\/\//.test(matcher)) {
		res.push(rule);
	} else if (/^proxy:\/\//.test(matcher)) {
		proxy.push(rule);
	} else {
		rules.push(rule);
	}
}

exports.parse = parse;

function resolveHost(_url, callback) {
	var options = _url ? url.parse(util.setProtocol(_url)) : {};
	var protocol = options.protocol;
	if (!util.isWebProtocol(protocol)) {
		callback(null, null);
		return;
	}
	var hostname = options.hostname;
	for (var i = 0, host; host = hosts[i]; i++) {
		if (host.isRegExp ? host.pattern.test(_url) : (hostname == host.pattern && (!host.protocol || host.protocol == protocol))) {
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

function getRule(url, _rules) {
	_rules = _rules || rules;
	var _url = url.replace(/(?:\?|#).*$/, '');
	for (var i = 0, rule; rule = _rules[i]; i++) {
		var pattern = rule.pattern;
		if (rule.isRegExp) {
			if (pattern.test(url)) {
				var regExp = {};
				for (var i = 0; i < 10; i++) {
					regExp['$' + i] = RegExp['$' + i] || '';
				}
				
				return extend({
					url: setProtocol(rule.matcher.replace(/(^|.)?(\$[1-9])/g, 
							function(matched, $1, $2) {
						return $1 == '\\' ? $2 : ($1 || '') + regExp[$2];
					}), url)
				}, rule);;
			}
		} else {
			pattern = setProtocol(pattern, url);
			if (_url.indexOf(pattern) === 0) {
				var len = pattern.length;
				if (pattern == _url || isPathSeparator(_url[len]) || isPathSeparator(pattern[len - 1])) {
					return extend({
						url: join(setProtocol(rule.matcher, url), url.substring(len))
					}, rule);
				}
			}
		}
	}
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

function resolveRule(url) {
	return getRule(url);
}

function resolveHead(url) {
	return getRule(url, heads);
}

function resolveReq(url) {
	return getRule(url, req);
}

function resolveRes(url) {
	return getRule(url, res);
}

function resolveProxy(url) {
	return getRule(url, proxy);
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

exports.resolveRules = function resolveRules(url) {
	var rules = {};
	var rule = resolveRule(url);
	if (rule) {
		rules.rule = rule;
	}
	if (rule = resolveHead(url)) {
		rules.head = rule;
	}
	if (rule = resolveReq(url)) {
		rules.req = rule;
	}
	if (rule = resolveRes(url)) {
		rules.res = rule;
	}
	if (rule = resolveProxy(url)) {
		rules.proxy = rule;
	}
	
	return rules;
};
