var util = require('../util');
var values = require('./util').values;
var url = require('url');
var net = require('net');
var lookup = require('./dns');
var extend = require('util')._extend;
var protoMgr = require('./protocols');
var allowDnsCache = true;
var WEB_PROTOCOL_RE = /^(?:https?|wss?|tunnel):\/\//;
var PORT_RE = /^(.*):(\d*)$/;
var PLUGIN_RE = /^(?:plugin|whistle)\.([a-z\d_\-]+:\/\/[\s\S]*)/;
var protocols = protoMgr.protocols;
var HOST_RE = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\:\d+)?$/;
var FILE_RE = /^(?:[a-z]:(?:\\|\/(?!\/))|\/)/i;
var PROXY_RE = /^(?:socks|http-proxy):\/\//;
var VAR_RE = /\${([^{}]+)}/g;

function isRule(str) {
  return util.hasProtocol(str) && !WEB_PROTOCOL_RE.test(str);
}

function detactShorthand(url) {
  if (HOST_RE.test(url)) {
    return 'host://' + url;
  }

  if (FILE_RE.test(url) && !util.isRegExp(url)) {
    return 'file://' + url;
  }

  return url;
}

function formatUrl(pattern) {
  var queryString = '';
  var queryIndex = pattern.indexOf('?');
  if (queryIndex != -1) {
    queryString = pattern.substring(queryIndex);
    pattern = pattern.substring(0, queryIndex);
  }
  var index = pattern.indexOf('://');
  return (pattern.indexOf('/', index == -1 ? 0 : index + 3) == -1 ?
pattern + '/' : pattern) + queryString;
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
    return index != -1 ? url.substring(1, index) : url;
  }

  return false;
}

function getPath(url) {
  if (url.indexOf('<') == 0) {
    var index = url.lastIndexOf('>');
    return index != -1 ? url.substring(1, index) : url;
  }

  return false;
}

function getFiles(path) {

  return /^x?((raw)?file|tpl|jsonp|dust):\/\//.test(path) ? util.removeProtocol(path, true).split('|') : null;
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
  if (second) {
    var lastIndex = first.length - 1;
    var startWithSep = isPathSeparator(second[0]);
    if (isPathSeparator(first[lastIndex])) {
      first = startWithSep ? first.substring(0, lastIndex) + second : first + second;
    } else {
      first = first + (startWithSep ? '' : '/') + second;
    }
  }

  return WEB_PROTOCOL_RE.test(first) ? formatUrl(first + query) : first + query;
}

function getLines(text) {
  if (!text || !(text = text.trim())) {
    return [];
  }

  return text.split(/\n|\r\n|\r/g);
}

function resolveVar(str, vals) {
  return str.replace(VAR_RE, function(all, key) {
    key = getValueFor(key, vals);
    return typeof key === 'string' ? key : all;
  });
}

function getValueFor(key, vals) {
  if (!key) {
    return;
  }
  if (vals && (key in vals)) {
    var val = vals[key];
    val = vals[key] = (val && typeof val == 'object') ? JSON.stringify(val) : val;
    return val;
  }
  return values.get(key);
}

function getRule(url, list, vals, index) {
  var rule = _getRule(url, list, vals, index);
  resolveValue(rule, vals);
  return rule;
}

function getRuleList(url, list, vals) {
  return _getRuleList(url, list, vals).map(function(rule) {
    return resolveValue(rule, vals);
  });
}

function resolveValue(rule, vals) {
  if (!rule) {
    return;
  }

  var matcher = rule.matcher;
  var index = matcher.indexOf('://') + 3;
  var protocol = matcher.substring(0, index);
  matcher = matcher.substring(index);
  var key = getKey(matcher);
  if (key) {
    rule.key = key;
  }
  var value = getValueFor(key, vals);
  if (value == null) {
    value = false;
  }
  if (value !== false || (value = getValue(matcher)) !== false) {
    rule.value = protocol + value;
  } else if ((value = getPath(matcher)) !== false) {
    rule.path = protocol + value;
    rule.files = getFiles(rule.path);
  }
  return rule;
}

function _getRule(url, list, vals, index) {
  return _getRuleList(url, list, vals, index || 0);
}

function _getRuleList(url, list, vals, index) {
  url = formatUrl(url);
  //支持域名匹配
  var domainUrl = formatUrl(url).replace(/^((?:https?|wss?|tunnel):\/\/[^\/]+):\d*(\/.*)/i, '$1$2');
  var isIndex = typeof index === 'number';
  index = isIndex ? index : -1;
  var results = [];
  var _url = url.replace(/[?#].*$/, '');
  var _domainUrl = domainUrl.replace(/[?#].*$/, '');
  var matchedUrl, files, matcher, result, origMatcher;
  for (var i = 0, rule; rule = list[i]; i++) {
    var pattern = rule.isRegExp ? rule.pattern : setProtocol(rule.pattern, url);

    if (rule.isRegExp) {
      if ((pattern.test(url) || (rule.isDomain && pattern.test(domainUrl))) && --index < 0) {
        var regExp = {};
        for (var j = 1; j < 10; j++) {
          regExp['$' + j] = RegExp['$' + j] || '';
        }

        var replaceSubMatcher = function(url) {
          return url.replace(/(^|.)?(\$[1-9])/g,
            function(matched, $1, $2) {
              return $1 == '\\' ? $2 : ($1 || '') + regExp[$2];
            });
        };
        matcher = resolveVar(rule.matcher, vals);
        files = getFiles(matcher);
        matcher = setProtocol(replaceSubMatcher(matcher), url);
        result = extend({
          url: matcher,
          files: files && files.map(function(file) {
            return replaceSubMatcher(file);
          })
        }, rule);
        result.matcher = matcher;
        if (isIndex) {
          return result;
        }
        results.push(result);
      }
    } else if (rule.isExact) {
      if (pattern == url && --index < 0) {
        origMatcher = resolveVar(rule.matcher, vals);
        matcher = setProtocol(origMatcher, url);
        result = extend({
          files: getFiles(matcher),
          url: matcher
        }, rule);
        result.matcher = origMatcher;
        if (isIndex) {
          return result;
        }
        results.push(result);
      }
    } else if ((matchedUrl = (url.indexOf(pattern) === 0)) ||
        (rule.isDomain && domainUrl.indexOf(pattern) === 0)) {
      var len = pattern.length;
      origMatcher = resolveVar(rule.matcher, vals);
      matcher = setProtocol(origMatcher, url);
      files = getFiles(matcher);
      var hasQuery = pattern.indexOf('?') != -1;
      if ((hasQuery || (matchedUrl ? (pattern == _url || isPathSeparator(_url[len])) :
        (pattern == _domainUrl || isPathSeparator(_domainUrl[len]))) ||
          isPathSeparator(pattern[len - 1])) && --index < 0) {
        var filePath = (matchedUrl ? url : domainUrl).substring(len);
        if (hasQuery && filePath) {
          filePath = '?' + filePath;
        }
        result = extend({
          files: files && files.map(function(file) {
            return join(file, filePath);
          }),
          url: join(matcher, filePath)
        }, rule);
        result.matcher = origMatcher;
        if (isIndex) {
          return result;
        }
        results.push(result);
      }
    }
  }
  
  return isIndex ? null : results;
}

function resolveProperties(url, rules, vals) {
  var rule = getRule(url, rules, vals);
  var result = {};
  if (rule) {
    util.getMatcherValue(rule)
      .split('|').forEach(function(action) {
        result[action] = true;
      });
  }

  return result;
}

function parseRule(rules, pattern, matcher, raw, root) {
  var isRegExp;
  var rawPattern = pattern;
  if (!pattern || !matcher ||
((isRegExp = util.isRegExp(pattern)) && !(pattern = util.toRegExp(pattern)))) {
    return;
  }

  var list, port, protocol, isExact;
  if (isExactPattern(pattern)) {
    isExact = true;
    pattern = pattern.slice(1);
  }
  if (net.isIP(matcher)) {
    list = rules.host;
    protocol = 'host';
  } else {
    if (matcher.indexOf('status://') === 0) {
      protocol = 'statusCode';
    } else if (PLUGIN_RE.test(matcher)) {
      protocol = 'plugin';
    } else if (PROXY_RE.test(matcher)) {
      protocol = 'proxy';
    } else {
      protocol = matcher.match(/^([\w\-]+):\/\//);
      protocol = protocol && protocol[1];
    }
    list = rules[protocol];
    if (!list) {
      protocol = 'rule';
      list = rules.rule;
    }
    if (protocol == 'host' && PORT_RE.test(matcher)) {
      matcher = RegExp.$1;
      port = RegExp.$2;
    }
  }

  list.push({
    name: protocol,
    root: root,
    isRegExp: isRegExp,
    isExact: isExact,
    protocol: isRegExp ? null : util.getProtocol(pattern),
    pattern: isRegExp ? pattern : formatUrl(pattern),
    matcher: matcher,
    port: port,
    raw: raw,
    isDomain: !isRegExp && util.removeProtocol(rawPattern, true).indexOf('/') == -1,
    rawPattern: rawPattern
  });
}

function parse(rules, text, root, append) {
  !append && protoMgr.resetRules(rules);
  if (Array.isArray(text)) {
    text.forEach(function(item) {
      item && _parse(rules, item.text, item.root, append);
    });
  } else {
    _parse(rules, text, root, append);
  }
}

function _parse(rules, text, root, append) {
  getLines(text).forEach(function(line) {
    var raw = line;
    line = line.replace(/#.*$/, '').trim();
    if (!line) {
      return;
    }

    line = line.split(/\s+/).map(detactShorthand);
    var pattern = line[0];
    if (!isExactPattern(pattern) && ((net.isIP(pattern) && !isRule(line[1])) || isRule(pattern)
|| (!util.isRegExp(pattern) && (isExactPattern(line[1]) || util.isRegExp(line[1]))))) {
//supports: operator-uri pattern1 pattern2 ... patternN
      line.slice(1).forEach(function(matcher) {
        parseRule(rules, matcher, pattern, raw, root);
      });
    } else {
//supports: pattern operator-uri1 operator-uri2 ... operator-uriN
      line.slice(1).forEach(function(matcher) {
        parseRule(rules, pattern, matcher, raw, root);
      });
    }
  });
}

function isExactPattern(pattern) {
  return /^\$/.test(pattern);
}

function Rules(values) {
  this._rules = protoMgr.getRules();
  this._values = values || {};
}

var proto = Rules.prototype;

proto.parse = function(text, root) {
  var item = {
    first: true,
    text: text,
    root: root
  };
  this.disabled = !arguments.length;
  if (this._rawText) {
    if (this._rawText[0].first) {
      this._rawText.shift();
    }
    this._rawText.unshift(item);
  } else {
    this._rawText = [item];
  }
  parse(this._rules, text, root);
  if (!this.disabled) {
    for (var i = 1, len = this._rawText.length; i < len; i++) {
      item = this._rawText[i];
      parse(this._rules, item.text, item.root, true);
    }
  }
};

proto.clearAppend = function() {
  if (this._rawText && this._rawText[0].first) {
    var item = this._rawText[0];
    !this.disabled && parse(this._rules, item.text, item.root);
    this._rawText = [item];
  } else {
    this._rawText = null;
  }
};

proto.append = function(text, root) {
  var item = {
    text: text,
    root: root
  };
  if (this._rawText) {
    this._rawText.push(item);
    !this.disabled && parse(this._rules, text, root, true);
  } else {
    this._rawText = [item];
  }
};

proto.resolveHost = function(_url, callback, pluginRules) {
  _url = formatUrl(util.setProtocol(_url));
  var options = url.parse(_url);
  if (!options.hostname || (!protoMgr.isWebsocketProtocol(options.protocol)
&& !protoMgr.isWebProtocol(options.protocol) && options.protocol != 'tunnel:')) {

    return callback(null, null);
  }

  var filterHost = this.resolveFilter(_url).host || (pluginRules && pluginRules.resolveFilter(_url).host);
  var vals = this._values;
  var host = !filterHost && ((pluginRules && getRule(_url, pluginRules._rules.host, vals)) ||  getRule(_url, this._rules.host, vals));
  if (host) {
    return callback(null, util.removeProtocol(host.matcher, true), host.port, host);
  }
  lookup(options.hostname, callback, allowDnsCache && !this.resolveDisable(_url).dnsCache);
};

proto.resolveFilter = function(url) {
  var filter = resolveProperties(url, this._rules.filter, this._values);
  extend(filter, resolveProperties(url, this._rules.ignore, this._values));
  delete filter.filter;
  return filter;
};
proto.resolveDisable = function(url) {
  return resolveProperties(url, this._rules.disable, this._values);
};

proto.resolveRules = function resolveRules(url) {
  var rule;
  var rules = this._rules;
  var _rules = {};
  var vals = this._values;
  var filter = this.resolveFilter(url);
  protocols.forEach(function(name) {
    if ((name === 'proxy' || !filter[name]) && (rule = getRule(url, rules[name], vals))) {
      _rules[name] = rule;
    }
  });
  var plugin = _rules.plugin;
  if (plugin) {
    plugin.list = getRuleList(url, rules.plugin, vals);
  }
  util.ignoreRules(_rules, filter);
  return _rules;
};

proto.resolveProxy = function resolveProxy(url) {
  var filter = this.resolveFilter(url);
  var proxy = getRule(url, this._rules.proxy, this._values);
  if (proxy) {
    var protocol = filter.proxy ? 'proxy:' : (filter.socks ? 'socks:' : '');
    if (protocol && proxy.matcher.indexOf(protocol) === 0) {
      return;
    }
  }
  return proxy; 
};

proto.resolveRule = function(url, index) {
  var filter = this.resolveFilter(url);
  if (filter.rule) {
    return;
  }
  if (index = index || 0) {
    index = parseInt(index, 10);
  }
  var rule = getRule(url, this._rules.rule, this._values, index);
  if (!rule) {
    return;
  }
  rule = {
    rule: rule
  };
  util.ignoreRules(rule, filter);
  return rule.rule;
};

Rules.disableDnsCache = function() {
  allowDnsCache = false;
};

module.exports = Rules;

