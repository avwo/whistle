var util = require('../util');
var rulesUtil = require('./util');
var rules = rulesUtil.rules;
var values = rulesUtil.values;
var url = require('url');
var net = require('net');
var lookup = require('./dns');
var extend = require('extend');
var protoMgr = require('./protocols');
var allowDnsCache = true;
var WEB_PROTOCOL_RE = /^(?:https?|wss?|tunnel):\/\//;
var PORT_RE = /^(.*):(\d*)$/;
var PLUGIN_RE = /^(?:plugin|whistle)\.([a-z\d_\-]+:\/\/[\s\S]*)/;
var protocols = protoMgr.protocols;
var HOST_RE = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\:\d+)?$/;
var FILE_RE = /^(?:[a-z]:(?:\\|\/(?!\/))|\/)/i;
var PROXY_RE = /^x?(?:socks|proxy|http-proxy|internal-proxy|https2http-proxy|http2https-proxy):\/\//;
var VAR_RE = /\${([^{}]+)}/g;
var NO_SCHEMA_RE = /^\/\/[^/]/;
var WILDCARD_RE = /^(\$?((?:https?|wss?|tunnel):\/\/)?([^/]+))/;
var RULE_KEY_RE = /^\$\{([^\s]+)\}$/;
var VALUE_KEY_RE = /^\{([^\s]+)\}$/;
var LINE_END_RE = /\n|\r\n|\r/g;
var LOCAL_RULE_RE = /^https?:\/\/local\.(?:whistlejs\.com|wproxy\.org)(?:\/|\?|$)/;
var PATH_RE = /^<.*>$/;
var VALUE_RE = /^\(.*\)$/;
var REG_URL_RE = /^((?:[\w.*-]+:|\*+)?\/\/)?([\w*.-]*)/;
var REG_URL_SYMBOL_RE = /^(\^+)/;
var PATTERN_FILTER_RE = /^(?:filter|ignore):\/\/(.+)\/(i)?$/;
var PATTERN_WILD_FILTER_RE = /^(?:filter|ignore):\/\/(!)?(\*+\/)/;
var aliasProtocols = protoMgr.aliasProtocols;
var regUrlCache = {};
var ALL_STAR_RE = /^\*{3,}$/;
var STAR_RE = /\*+/g;
var PORT_PATTERN_RE = /^!?:\d{1,5}$/;
var QUERY_RE = /[?#].*$/;
var COMMENT_RE = /#.*$/;

function domainToRegExp(all, index) {
  var len = all.length;
  if (!index && len > 2) {
    return '((?:[a-z]+://)?[^/]*)';
  }
  return len > 1 ? '([^/]*)' : '([^/.]*)';
}

function pathToRegExp(all) {
  var len = all.length;
  if (len > 2) {
    return '(.*)';
  }
  return len > 1 ? '([^?]*)' : '([^?/]*)';
}

function queryToRegExp(all) {
  return all.length > 1 ? '(.*)' : '([^&]*)';
}

function isRegUrl(url) {
  if (regUrlCache[url]) {
    return true;
  }
  var oriUrl = url;
  var not = isNegativePattern(url);
  if (not) {
    url = url.substring(1);
  }
  var hasStartSymbol = REG_URL_SYMBOL_RE.test(url);
  var hasEndSymbol;
  var ignoreCase;
  if (hasStartSymbol) {
    ignoreCase = RegExp.$1.length;
    url = url.substring(ignoreCase);
    hasEndSymbol = /\$$/.test(url);
    if (hasEndSymbol) {
      url = url.slice(0, -1);
    }
  }
  if (!hasStartSymbol || !REG_URL_RE.test(url)) {
    return false;
  }
  var protocol = RegExp.$1 || '';
  var domain = RegExp.$2;
  var pathname = url.substring(protocol.length + domain.length);
  var query = '';
  var index = pathname.indexOf('?');
  if (index !== -1) {
    query = pathname.substring(index);
    pathname = pathname.substring(0, index);
  }
  if (protocol || !ALL_STAR_RE.test(domain)) {
    if (!protocol || protocol === '//') {
      protocol = '[a-z]+://';
    } else {
      protocol = util.escapeRegExp(protocol).replace(/\*+/, '([a-z:]+)');
    }
  }
  domain = util.escapeRegExp(domain);
  if (domain) {
    domain = domain.replace(STAR_RE, domainToRegExp);
  } else {
    domain = '[^/.]*';
  }
  if (pathname) {
    pathname = util.escapeRegExp(pathname).replace(STAR_RE, pathToRegExp);
  } else if (query || hasEndSymbol) {
    pathname = '/';
  }
  query = util.escapeRegExp(query).replace(STAR_RE, queryToRegExp);
  var pattern = '^' + protocol + domain + pathname + query + (hasEndSymbol ? '$' : '');
  try {
    regUrlCache[oriUrl] = {
      not: not,
      pattern: new RegExp(pattern, ignoreCase ? 'i' : '')
    };
  } catch (e) {}
  return true;
}

function getRealProtocol(matcher) {
  var index = matcher.indexOf(':');
  if (index === -1) {
    return;
  }
  var protocol = matcher.substring(0, index);
  return aliasProtocols[protocol];
}

function detactShorthand(url) {
  if (NO_SCHEMA_RE.test(url)) {
    return url.substring(2);
  }

  if (url === '{}' || VALUE_KEY_RE.test(url) || PATH_RE.test(url) || VALUE_RE.test(url)) {
    return 'file://' + url;
  }

  if (FILE_RE.test(url) && !util.isRegExp(url)) {
    return 'file://' + url;
  }
  // compact Chrome
  if (/^file:\/\/\/[A-Z]:\//.test(url)) {
    return 'file://' + url.substring(8);
  }

  if (/^@/.test(url)) {
    if (url.indexOf('@://') === -1) {
      url = '@://' + url.substring(1);
    }
    return url.replace('@', 'G');
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
  index = pattern.indexOf('/', index == -1 ? 0 : index + 3);
  return (index == -1 ? pattern + '/' : pattern) + queryString;
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

function getLines(text, root) {
  if (!text || !(text = text.trim())) {
    return [];
  }
  var ruleKeys = {};
  var valueKeys = {};
  var lines = text.split(LINE_END_RE);
  var result = [];
  lines.forEach(function(line) {
    line = line.trim();
    if (!line) {
      return;
    }
    var isRuleKey = RULE_KEY_RE.test(line);
    if (isRuleKey || VALUE_KEY_RE.test(line)) {
      if (root) {
        var key = RegExp.$1;
        line = '';
        if (isRuleKey) {
          if (!ruleKeys[key]) {
            ruleKeys[key] = 1;
            line = rules.get(key);
          }
        } else if (!valueKeys[key]) {
          valueKeys[key] = 1;
          line = values.get(key);
        }
        if (line) {
          result.push.apply(result, line.split(LINE_END_RE));
        }
      }
    } else {
      result.push(line);
    }
  });
  return result;
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

function getRelativePath(pattern, url, matcher) {
  var index = url.indexOf('?');
  if (index === -1 || pattern.indexOf('?') !== -1) {
    return '';
  }
  if (matcher.indexOf('?') === -1) {
    return url.substring(index);
  }
  url = url.substring(index + 1);
  return (url && '&') + url;
}

var SEP_RE = /^[?/]/;
function _getRuleList(url, list, vals, index) {
  url = formatUrl(url);
  //支持域名匹配
  var domainUrl = formatUrl(url).replace(/^((?:https?|wss?|tunnel):\/\/[^\/]+):\d*(\/.*)/i, '$1$2');
  var isIndex = typeof index === 'number';
  index = isIndex ? index : -1;
  var results = [];
  var _url = url.replace(QUERY_RE, '');
  var _domainUrl = domainUrl.replace(QUERY_RE, '');
  var rule, matchedUrl, files, matcher, result, origMatcher, filePath;
  var getPathRule = function() {
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
  };
  var getExactRule = function(relPath) {
    origMatcher = resolveVar(rule.matcher, vals);
    matcher = setProtocol(origMatcher, url);
    result = extend({
      files: getFiles(matcher),
      url: matcher + relPath
    }, rule);
    result.matcher = origMatcher;
    if (isIndex) {
      return result;
    }
    results.push(result);
  };

  for (var i = 0; rule = list[i]; i++) {
    var pattern = rule.isRegExp ? rule.pattern : setProtocol(rule.pattern, url);
    var not = rule.not;
    var matchedRes;
    if (rule.isRegExp) {
      matchedRes = pattern.test(url);
      if ((not ? !matchedRes : matchedRes) && !matchFilters(url, rule) && --index < 0) {
        var regExp = {};
        if (!not) {
          for (var j = 1; j < 10; j++) {
            regExp['$' + j] = RegExp['$' + j];
          }
        }
        regExp['$&'] = regExp.$0 = url;

        var replaceSubMatcher = function(url) {
          return url.replace(/(^|.)?(\$[&\d])/g,
            function(matched, $1, $2) {
              return $1 == '\\' ? $2 : ($1 || '') + (regExp[$2] || '');
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
    } else if (rule.wildcard) {
      var wildcard = rule.wildcard;
      if (wildcard.preMatch.test(url) && !matchFilters(url, rule)) {
        var hostname = RegExp.$1;
        filePath = url.substring(hostname.length);
        var wPath = wildcard.path;
        if (wildcard.isExact) {
          if ((filePath === wPath || filePath.replace(QUERY_RE, '') === wPath) && --index < 0) {
            if (result = getExactRule(getRelativePath(wPath, filePath, rule.matcher))) {
              return result;
            }
          }
        } else if (filePath.indexOf(wPath) === 0) {
          var wpLen = wPath.length;
          filePath = filePath.substring(wpLen);
          if ((wildcard.hasQuery || !filePath || wPath[wpLen - 1] === '/' || SEP_RE.test(filePath)) && --index < 0) {
            origMatcher = resolveVar(rule.matcher, vals);
            matcher = setProtocol(origMatcher, url);
            files = getFiles(matcher);
            if (wildcard.hasQuery && filePath) {
              filePath = '?' + filePath;
            }
            if (result = getPathRule()) {
              return result;
            }
          }
        }
      }
    } else if (rule.isExact) {
      matchedRes = pattern === _url || pattern === url;
      if ((not ? !matchedRes : matchedRes) && !matchFilters(url, rule) && --index < 0) {
        if (result = getExactRule(getRelativePath(pattern, url, rule.matcher))) {
          return result;
        }
      }
    } else if (((matchedUrl = (url.indexOf(pattern) === 0)) ||
        (rule.isDomain && domainUrl.indexOf(pattern) === 0)) && !matchFilters(url, rule)) {
      var len = pattern.length;
      origMatcher = resolveVar(rule.matcher, vals);
      matcher = setProtocol(origMatcher, url);
      files = getFiles(matcher);
      var hasQuery = pattern.indexOf('?') !== -1;
      if ((hasQuery || (matchedUrl ? (pattern == _url || isPathSeparator(_url[len])) :
        (pattern == _domainUrl || isPathSeparator(_domainUrl[len]))) ||
          isPathSeparator(pattern[len - 1])) && --index < 0) {
        filePath = (matchedUrl ? url : domainUrl).substring(len);
        if (hasQuery && filePath) {
          filePath = '?' + filePath;
        }
        if (result = getPathRule()) {
          return result;
        }
      }
    }
  }

  return isIndex ? null : results;
}

function resolveProperties(url, rules, vals) {
  return util.resolveProperties(getRule(url, rules, vals));
}

function parseWildcard(pattern, not) {
  if (!WILDCARD_RE.test(pattern)) {
    return;
  }
  var preMatch = RegExp.$1;
  var protocol = RegExp.$2;
  var domain = RegExp.$3;
  if (domain.indexOf('*') === -1 && domain.indexOf('~') === -1) {
    return;
  }
  if (not) {
    return false;
  }
  var path = pattern.substring(preMatch.length) || '/';
  var isExact = preMatch.indexOf('$') === 0;
  if (isExact) {
    preMatch = preMatch.substring(1);
  }
  if ((domain === '*' || domain === '~') && path.charAt(0) === '/') {
    preMatch += '*';
  }
  var index = path.indexOf('?');
  var hasQuery = index !== -1;
  if (hasQuery && index === 0) {
    path = '/' + path;
  }
  var dLen = domain.length;
  preMatch = util.escapeRegExp(preMatch).replace(/[*~]+/g, domainToRegExp);
  if (domain[dLen - 1] !== '*' && domain.indexOf(':') === -1) {
    preMatch += '(?::\\d+)?';
  }
  if (!protocol) {
    preMatch = '[a-z]+://' + preMatch;
  } else if (protocol === '//') {
    preMatch = '[a-z]+:' + preMatch;
  }
  preMatch = '^(' + preMatch + ')';

  return {
    preMatch: new RegExp(preMatch),
    path: path,
    hasQuery: hasQuery,
    isExact: isExact
  };
}
function parseRule(rules, pattern, matcher, raw, root, filters) {
  if (isNegativePattern(matcher)) {
    return;
  }
  var regUrl = regUrlCache[pattern];
  var rawPattern = pattern;
  var isRegExp, not, list, port, protocol, isExact;
  if (regUrl) {
    not = regUrl.not;
    isRegExp = true;
    pattern = regUrl.pattern;
  } else {
    not = isNegativePattern(pattern);
    // 位置不能变
    var isPortPattern = PORT_PATTERN_RE.test(pattern);
    if (not) {
      pattern = pattern.substring(1);
    }
    if (isPortPattern) {
      isRegExp = true;
      pattern = new RegExp('^[\\w]+://[^/]+' + pattern + '/');
    }
    if (!isRegExp && (isRegExp = util.isRegExp(pattern)) && !(pattern = util.toRegExp(pattern))) {
      return;
    }
    if (!isRegExp) {
      var wildcard = parseWildcard(pattern, not);
      if (wildcard === false) {
        return;
      }
      if (!wildcard && isExactPattern(pattern)) {
        isExact = true;
        pattern = pattern.slice(1);
      } else if (not) {
        return;
      }
    }
  }
  var isIp = net.isIP(matcher);
  if (isIp || HOST_RE.test(matcher)) {
    matcher = 'host://' + matcher;
    protocol = 'host';
  } else if (matcher[0] === '/') {
    matcher = 'file://' + matcher;
    protocol = 'file';
  } else if (PLUGIN_RE.test(matcher)) {
    protocol = 'plugin';
  } else if (PROXY_RE.test(matcher)) {
    protocol = 'proxy';
  } else if (!(protocol = getRealProtocol(matcher))) {
    protocol = matcher.match(/^([\w\-]+):\/\//);
    protocol = protocol && protocol[1];
    if (matcher === 'host://') {
      matcher = 'host://127.0.0.1';
    }
  }

  if (!(list = rules[protocol])) {
    protocol = 'rule';
    list = LOCAL_RULE_RE.test(matcher) ? rules._localRule : rules.rule;
  } else if (!isIp && protocol == 'host' && PORT_RE.test(matcher)) {
    matcher = RegExp.$1;
    port = RegExp.$2;
  }

  list.push({
    not: not,
    name: protocol,
    root: root,
    wildcard: wildcard,
    isRegExp: isRegExp,
    isExact: isExact,
    protocol: isRegExp ? null : util.getProtocol(pattern),
    pattern: isRegExp ? pattern : formatUrl(pattern),
    matcher: matcher,
    port: port,
    raw: raw,
    isDomain: !isRegExp && !not && util.removeProtocol(rawPattern, true).indexOf('/') == -1,
    rawPattern: rawPattern,
    filters: filters
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

function indexOfPattern(list) {
  var ipIndex = -1;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (PORT_PATTERN_RE.test(item) || isExactPattern(item) || isRegUrl(item) ||
      isNegativePattern(item) || WEB_PROTOCOL_RE.test(item) || util.isRegExp(item)) {
      return i;
    }

    if (!util.hasProtocol(item)) {
      if (!net.isIP(item) && !HOST_RE.test(item)) {
        return i;
      } else if (ipIndex === -1) {
        ipIndex = i;
      }
    }
  }
  return ipIndex;
}

function resolveFilterPattern(matcher) {
  if (PATTERN_FILTER_RE.test(matcher)) {
    return {
      filter: RegExp.$1,
      caseIns: RegExp.$2
    };
  }
  if (!PATTERN_WILD_FILTER_RE.test(matcher)) {
    return;
  }
  var not = RegExp.$1 || '';
  var wildcard = RegExp.$2;
  matcher = matcher.substring(matcher.indexOf('://') + 3 + not.length);
  var path = util.escapeRegExp(matcher.substring(wildcard.length));
  if (path.indexOf('*') !== -1) {
    path = path.replace(STAR_RE, pathToRegExp);
  } else if (path && path[path.length - 1] !== '/') {
    path += '(?:[/?]|$)';
  }
  return {
    filter: '^[a-z]+://[^/]+/' + path
  };
}

function resolveMatchFilter(list) {
  var matchers = [];
  var filters;
  list.forEach(function(matcher) {
    var result = resolveFilterPattern(matcher);
    if (!result) {
      matchers.push(matcher);
      return;
    }
    var filter = result.filter;
    var caseIns = result.caseIns;
    var not = filter[0] === '!';
    if (not) {
      filter = filter.substring(1);
    }
    if (filter[0] === '/') {
      filter = filter.substring(1);
    }
    if (!filter) {
      return;
    }
    filter = '/' + filter + '/' + (caseIns ? 'i' : '');
    if (filter = util.toRegExp(filter)) {
      filters = filters || [];
      filters.push({
        raw: matcher,
        pattern: filter,
        not: not
      });
    }
  });
  return {
    matchers: matchers,
    filters: filters
  };
}

function _parse(rules, text, root, append) {
  getLines(text, root).forEach(function(line) {
    var raw = line;
    line = line.replace(COMMENT_RE, '').trim();
    line = line && line.split(/\s+/);
    var len = line && line.length;
    if (!len || len < 2) {
      return;
    }
    line = line.map(detactShorthand);
    var patternIndex = indexOfPattern(line);
    if (patternIndex === -1) {
      return;
    }

    var pattern = line[0];
    var result = resolveMatchFilter(line.slice(1));
    var filters = result.filters;
    var matchers = result.matchers;
    if (patternIndex > 0) {
      //supports: operator-uri pattern1 pattern2 ... patternN
      matchers.forEach(function(matcher) {
        parseRule(rules, matcher, pattern, raw, root, filters);
      });
    } else {
      //supports: pattern operator-uri1 operator-uri2 ... operator-uriN
      matchers.forEach(function(matcher) {
        parseRule(rules, pattern, matcher, raw, root, filters);
      });
    }
  });
  regUrlCache = {};
}

function isExactPattern(pattern) {
  return /^\$/.test(pattern);
}

function isNegativePattern(pattern) {
  return /^!/.test(pattern);
}

function matchFilter(url, filter) {
  var result = filter.pattern.test(url);
  return filter.not ? !result : result;
}

function matchFilters(url, rule) {
  var filters = rule.filters;
  var filter = filters && filters[0];
  if (!filter) {
    return false;
  }
  // refine perfermence
  if (matchFilter(url, filter)) {
    return true;
  }
  filter = filters[1];
  if (!filter) {
    return false;
  }
  if (matchFilter(url, filter)) {
    return true;
  }
  for (var i = 0, len = filters.length; i < len; i++) {
    if (matchFilter(url, filter)) {
      return true;
    }
  }
  return false;
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

proto.resolveHost = function(_url, callback, pluginRulesMgr, rulesFileMgr, headerRulesMgr) {
  if (!_url || typeof _url !== 'string') {
    return callback();
  }
  var host = this.getHost(_url, pluginRulesMgr, rulesFileMgr, headerRulesMgr);
  if (host) {
    return callback(null, util.removeProtocol(host.matcher, true), host.port, host);
  }
  this.lookupHost(_url, callback);
};

proto.lookupHost = function(_url, callback) {
  _url = formatUrl(util.setProtocol(_url));
  var options = url.parse(_url);
  if (options.hostname === '::1') {
    return callback(null, '127.0.0.1');
  }
  lookup(options.hostname, callback, allowDnsCache && !this.resolveDisable(_url).dnsCache);
};

var ignoreHost = function(url, rulesMgr) {
  if (!rulesMgr) {
    return false;
  }
  var ignore = rulesMgr.resolveFilter(url);
  return ignore.host || ignore.hosts || ignore['ignore|host'] || ignore['ignore|hosts'];
};
proto.getHost = function(url, pluginRulesMgr, rulesFileMgr, headerRulesMgr) {
  url = formatUrl(util.setProtocol(url));
  var filterHost = ignoreHost(url, this) || ignoreHost(url, pluginRulesMgr)
    || ignoreHost(url, rulesFileMgr) || ignoreHost(url, headerRulesMgr);
  var vals = this._values;
  if (filterHost) {
    return;
  }
  var host = (pluginRulesMgr && getRule(url, pluginRulesMgr._rules.host, pluginRulesMgr._values))
  || getRule(url, this._rules.host, vals)
  || (rulesFileMgr && getRule(url, rulesFileMgr._rules.host, vals))
  || (headerRulesMgr && getRule(url, headerRulesMgr._rules.host, vals));
  if (host && PORT_RE.test(host.matcher)) {
    host.matcher = RegExp.$1;
    host.port = RegExp.$2;
  }
  return host;
};

proto.resolveFilter = function(url) {
  var filter = resolveProperties(url, this._rules.filter, this._values);
  var ignore = resolveProperties(url, this._rules.ignore, this._values);
  util.resolveFilter(ignore, filter);
  delete filter.filter;
  delete filter.ignore;
  delete filter['ignore|' + filter];
  delete filter['ignore|' + ignore];
  return filter;
};
proto.resolveDisable = function(url) {
  return resolveProperties(url, this._rules.disable, this._values);
};

proto.resolveRules = function(url) {
  var rule;
  var rules = this._rules;
  var _rules = {};
  var vals = this._values;
  var filter = this.resolveFilter(url);
  protocols.forEach(function(name) {
    if ((name === 'proxy' || name === 'rule' || name === 'plugin'
      || !filter[name]) && (rule = getRule(url, rules[name], vals))) {
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
    if (util.isIgnored(filter, 'proxy')) {
      return;
    }
    var matcher = proxy.matcher;
    if (util.isIgnored(filter, 'socks')) {
      if (matcher.indexOf('socks://') === 0) {
        return;
      }
    } else if (util.isIgnored(filter, 'http-proxy')) {
      if (matcher.indexOf('proxy://') === 0 || matcher.indexOf('http-proxy://') === 0) {
        return;
      }
    }
  }
  return proxy;
};

proto.resolveLocalRule = function(url) {
  return getRule(url, this._rules._localRule);
};

Rules.disableDnsCache = function() {
  allowDnsCache = false;
};

module.exports = Rules;

