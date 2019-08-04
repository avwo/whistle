var util = require('../util');
var rulesUtil = require('./util');
var rules = rulesUtil.rules;
var values = rulesUtil.values;
var url = require('url');
var net = require('net');
var lookup = require('./dns');
var extend = require('extend');
var protoMgr = require('./protocols');
var config = require('../config');

var allowDnsCache = true;
var SUB_MATCH_RE = /\$[&\d]/;
var SPACE_RE = /\s+/g;
var MULTI_TO_ONE_RE = /^\s*line`\s*[\r\n]([\s\S]*?)[\r\n]\s*`\s*$/mg;
var MULTI_LINE_VALUE_RE = /^[^\n\r\S]*(```+)[^\n\r\S]*(\S+)[^\n\r\S]*[\r\n]([\s\S]+?)[\r\n][^\n\r\S]*\1\s*$/mg;
var WEB_PROTOCOL_RE = /^(?:https?|wss?|tunnel):\/\//;
var PORT_RE = /^host:\/\/(?:([^\[\]:]*)|\[([:\da-f]*:[\da-f]*:[\da-f]+)\])(?::(\d+))?$/i;
var PLUGIN_RE = /^(?:plugin|whistle)\.([a-z\d_\-]+:\/\/[\s\S]*)/;
var protocols = protoMgr.protocols;
var multiMatchs = protoMgr.multiMatchs;
var HOST_RE = /^(?:(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)|[:\da-f]*:[\da-f]*:[\da-f]+|\[[:\da-f]*:[\da-f]*:[\da-f]+\])(?::\d+)?$/i;
var FILE_RE = /^(?:[a-z]:(?:\\|\/[^/])|\/[^/])/i;
var PROXY_RE = /^x?(?:socks|proxy|https?-proxy|internal-proxy|https2http-proxy|http2https-proxy):\/\//;
var VAR_RE = /\${([^{}]+)}/g;
var NO_SCHEMA_RE = /^\/\/[^/]/;
var WILDCARD_RE = /^(\$?((?:https?|wss?|tunnel):\/\/)?([^/?]+))/;
var RULE_KEY_RE = /^\$\{(\S+)\}$/;
var VALUE_KEY_RE = /^\{(\S+)\}$/;
var LINE_END_RE = /\n|\r\n|\r/g;
var LOCAL_RULE_RE = /^https?:\/\/local\.(?:whistlejs\.com|wproxy\.org)(?:\/|\?|$)/;
var PATH_RE = /^<.*>$/;
var VALUE_RE = /^\(.*\)$/;
var REG_URL_RE = /^((?:[\w.*-]+:|\*+)?\/\/)?([^/?]*)/;
var REG_URL_SYMBOL_RE = /^(\^+)/;
var PATTERN_FILTER_RE = /^(?:filter|ignore):\/\/(.+)\/(i)?$/;
var FILTER_RE = /^(?:excludeFilter|includeFilter):\/\/(.*)$/;
var PROPS_FILTER_RE = /^(?:filter|excludeFilter|includeFilter|ignore):\/\/(m(?:ethod)?|i(?:p)?|h(?:eader)?|s(?:tatusCode)?|b(?:ody)?|clientIp|clientIP|serverIp|serverIP|req(?:H(?:eaders?)?)?|res(?:H(?:eaders?)?)?):(.+)$/;
var PATTERN_WILD_FILTER_RE = /^(?:filter|ignore):\/\/(!)?(\*+\/)/;
var WILD_FILTER_RE = /^(\*+\/)/;
var aliasProtocols = protoMgr.aliasProtocols;
var regUrlCache = {};
var NON_STAR_RE = /[^*]$/;
var DOMAIN_STAR_RE = /([*~]+)(\\.)?/g;
var STAR_RE = /\*+/g;
var PORT_PATTERN_RE = /^!?:\d{1,5}$/;
var QUERY_RE = /[?#].*$/;
var COMMENT_RE = /#.*$/;
var TPL_RE = /^((?:[\w-]+:)?\/\/)?(`.*`)$/;
// url:  protocol, host, port, hostname, search, query, pathname, path, href, query.key
// req|res: ip, method, statusCode, headers?.key, cookies?.key
var TPL_VAR_RE = /(\$)?\$\{(id|reqId|whistle|now|port|version|url|query|search|queryString|searchString|path|pathname|ip|clientIp|serverIp|method|status(?:Code)|reqCookies?|resCookies?|reqHeaders?|resHeaders?)(?:\.([^{}]+))?\}/ig;
var REPLACE_PATTERN_RE = /(^|\.)replace\((.+)\)$/i;
var SEP_RE = /^[?/]/;
var COMMA1_RE = /\\,/g;
var COMMA2_RE = /\\\\,/g;
var G_CR_RE = /\r/g;
var G_LF_RE = /\n/g;
var inlineValues;
var CONTROL_RE = /[\u001e\u001f\u200e\u200f\u200d\u200c\u202a\u202d\u202e\u202c\u206e\u206f\u206b\u206a\u206d\u206c]+/g;

function domainToRegExp(all, star, dot) {
  var len = star.length;
  var result = len > 1 ? '([^/?]*)' : '([^/?.]*)';
  if (dot) {
    result += '\\.';
    if (len > 2) {
      result = '(?:' + result + ')?';
    }
  }
  return result;
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
  var result = regUrlCache[url];
  if (result) {
    return result;
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
  if (!protocol || protocol === '//') {
    protocol = '[a-z]+://';
  } else {
    protocol = util.escapeRegExp(protocol).replace(/\*+/, '([a-z:]+)');
  }
  domain = util.escapeRegExp(domain);
  if (domain.length > 2 && !NON_STAR_RE.test(domain)) {
    domain = '([^?]*)';
  } else if (domain) {
    domain = domain.replace(DOMAIN_STAR_RE, domainToRegExp);
  } else {
    domain = '[^/?]*';
  }
  if (pathname) {
    pathname = util.escapeRegExp(pathname).replace(STAR_RE, pathToRegExp);
  } else if (query || hasEndSymbol) {
    pathname = '/';
  }
  query = util.escapeRegExp(query).replace(STAR_RE, queryToRegExp);
  var pattern = '^' + protocol + domain + pathname + query + (hasEndSymbol ? '$' : '');
  try {
    result = regUrlCache[oriUrl] = {
      not: not,
      pattern: new RegExp(pattern, ignoreCase ? 'i' : '')
    };
  } catch (e) {}
  return result;
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
    return url;
  }

  if (url === '{}' || VALUE_KEY_RE.test(url) || PATH_RE.test(url) || VALUE_RE.test(url)) {
    return 'file://' + url;
  }

  if (url === '/' || (FILE_RE.test(url) && !util.isRegExp(url))) {
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

  return protocol + (NO_SCHEMA_RE.test(target) ? '' : '//') + target;
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
function joinQuery(firstQuery, secondQuery) {
  if (!firstQuery || !secondQuery) {
    return firstQuery || secondQuery;
  }
  secondQuery = secondQuery.substring(1);
  var firstLen = firstQuery.length;
  var secondLen = secondQuery.length;
  var sep = firstLen < 2 || !secondLen || firstQuery[firstLen - 1] === '&'
    || secondQuery[0] === '&' ? '' : '&';
  return firstQuery + sep + secondQuery;
}
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

  if (second) {
    var lastIndex = first.length - 1;
    var startWithSep = isPathSeparator(second[0]);
    if (isPathSeparator(first[lastIndex])) {
      first = startWithSep ? first.substring(0, lastIndex) + second : first + second;
    } else {
      first = first + (startWithSep ? '' : '/') + second;
    }
  }
  var query = joinQuery(firstQuery, secondQuery);
  return WEB_PROTOCOL_RE.test(first) ? formatUrl(first + query) : first + query;
}

function toLine(_, line) {
  return line.replace(SPACE_RE, ' ');
}

function getLines(text, root) {
  if (!text || !(text = text.trim())) {
    return [];
  }
  text = text.replace(MULTI_TO_ONE_RE, toLine);
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

function resolvePropValue(obj, key) {
  return key && obj && obj[key.toLowerCase()] || '';
}

function resolveUrlVar(req, key, escape) {
  var url = req.fullUrl;
  if (!key) {
    return url;
  }
  var options = req.__options || req.options;
  if (!options || options.href !== url) {
    options = req.__options = util.parseUrl(url);
    req.__query = '';
  }
  if (key.indexOf('query.') !== 0 || !options.query) {
    return options[key] || '';
  }
  var query = req.__query;
  if (!query) {
    query = req.__query = util.parseQuery(options.query, null, null, escape);
  }
  return util.getQueryValue(query[key.substring(6)]);
}
function resolveReqCookiesVar(req, key, escape) {
  var cookie = req.headers.cookie || '';
  if (!cookie || !key) {
    return cookie;
  }
  var cookies = req.__cookies;
  if (!cookies || req.__rawCookies !== cookie) {
    req.__rawCookies = cookie;
    cookies = req.__cookies = util.parseQuery(cookie, '; ', null, escape);
  }
  return util.getQueryValue(cookies[key]);
}
function resolveResCookiesVar(req, key) {
  var resHeaders = req.resHeaders;
  var cookie = resHeaders && resHeaders['set-cookie'];
  var isArray = Array.isArray(cookie);
  if (!isArray && cookie) {
    isArray = true;
    cookie = [String(cookie)];
  }
  if (!isArray) {
    return cookie || '';
  }
  var rawCookie = cookie.join(', ');
  if (!key || !rawCookie) {
    return rawCookie;
  }
  var cookies = req.__resCookies;
  if (!cookies || req.__rawResCookies !== rawCookie) {
    req.__rawResCookies = cookie.join();
    cookies = req.__resCookies = {};
    cookie.forEach(function(c) {
      c = util.parseQuery(c, '; ', null, escape);
      Object.keys(c).forEach(function(key) {
        var item = {};
        switch(key.toLowerCase()) {
        case 'domain':
          item.domain = c[key];
          break;
        case 'path':
          item.path = c[key];
          break;
        case 'expires':
          item.expires = c[key];
          break;
        case 'max-age':
          item.maxAge = item['max-age'] = item['Max-Age'] = c[key];
          break;
        case 'httponly':
          item.httpOnly = true;
          break;
        case 'secure':
          item.secure = true;
          break;
        case 'samesite':
          item.samesite = item.sameSite = item.SameSite = c[key];
          break;
        default:
          if (!cookies[key]) {
            item.value = c[key];
            cookies[key] = item;
          }
        }
      });
    });
  }
  var index = key.indexOf('.');
  var name;
  if (index !== -1) {
    name = key.substring(index + 1);
    key = key.substring(0, index);
  }
  cookie = cookies[key];
  if (!cookie) {
    return '';
  }
  return (name ? cookie[name] : cookie.value) || '';
}
function resolveClientIpVar(req, key) {
  return req.clientIp;
}
function resolveServerIpVar(req, key) {
  if (!req.resHeaders) {
    return '';
  }
  return req.hostIp || '127.0.0.1';
}
function resolveMethodVar(req, key) {
  return req.method;
}
function resolveStatusCodeVar(req, key) {
  return req.statusCode || '';
}
function resolveReqHeadersVar(req, key) {
  return resolvePropValue(req.headers, key);
}
function resolveResHeadersVar(req, key) {
  return resolvePropValue(req.resHeaders, key);
}
function resolveRuleValue(req, key) {
  var plugin = key && req.rules && req.rules.plugin;
  var matcher;
  key = key + '://';
  if (plugin) {
    var list = Array.isArray(plugin.list) ? plugin.list : [plugin];
    var name = 'whistle.' + key;
    for (var i = 0, len = list.length; i < len; i++) {
      matcher = list[i].matcher;
      if (!matcher.indexOf(name)) {
        return matcher.substring(name.length);
      }
    }
  }
  matcher = req.rules.rule && req.rules.rule.matcher;
  if (matcher && !matcher.indexOf(key)) {
    return matcher.substring(key.length);
  }
  return '';
}

function resolveVarValue(req, escape, name, key) {
  var lname = name.toLowerCase();
  switch(lname) {
  case 'now':
    return Date.now();
  case 'id':
  case 'reqid':
    return req.reqId || '';
  case 'whistle':
    return resolveRuleValue(req, key);
  case 'path':
  case 'pathname':
  case 'search':
    return key ? '' : resolveUrlVar(req, lname, escape);
  case 'querystring':
  case 'searchstring':
    return key ? '' : (resolveUrlVar(req, 'search', escape) || '?');
  case 'query':
    key = key ? 'query.' + key : 'query';
    return resolveUrlVar(req, key, escape);
  case 'url':
    return resolveUrlVar(req, key, escape);
  case 'port':
    return config.port;
  case 'version':
    return config.version;
  case 'reqcookie':
  case 'reqcookies':
    return resolveReqCookiesVar(req, key, escape);
  case 'rescookie':
  case 'rescookies':
    return resolveResCookiesVar(req, key, escape);
  case 'method':
    return resolveMethodVar(req, key);
  case 'ip':
  case 'clientip':
    return resolveClientIpVar(req, key);
  case 'statuscode':
  case 'status':
    return resolveStatusCodeVar(req, key);
  case 'serverip':
    return resolveServerIpVar(req, key);
  case 'reqheader':
  case 'reqheaders':
    return resolveReqHeadersVar(req, key);
  default:
    return resolveResHeadersVar(req, key);
  }
}

function resetComma(str) {
  return str && str.replace(G_CR_RE, ',').replace(G_LF_RE, '\\,');
}

function resolveTplVar(value, req) {
  return value.replace(TPL_VAR_RE, function(_, escape, name, key) {
    var pattern, regPattern;
    var replacement = '';
    if (REPLACE_PATTERN_RE.test(key)) {
      pattern = RegExp.$2;
      var dot = RegExp.$1 || '';
      key = key.substring(0, key.length - 9 - dot.length - pattern.length);
      if (pattern.indexOf(',') !== -1) {
        pattern = pattern.replace(COMMA2_RE, '\n').replace(COMMA1_RE, '\r');
        var index = pattern.indexOf(',');
        if (index !== -1) {
          replacement = resetComma(pattern.substring(index + 1));
          pattern = pattern.substring(0, index);
        }
        pattern = resetComma(pattern);
      }
      regPattern = util.toOriginalRegExp(pattern);
    }
    var val = resolveVarValue(req, escape, name, key);
    if (!val || !pattern) {
      return pattern ? val : (val || replacement);
    }
    if (!regPattern || !SUB_MATCH_RE.test(replacement)) {
      return val.replace(regPattern || pattern, replacement);
    }
    return val.replace(regPattern, function() {
      return util.replacePattern(replacement, arguments);
    });
  });
}

function renderTpl(rule, req) {
  var matcher = rule.matcher;
  if (rule.isTpl === false) {
    return matcher;
  }
  rule.isTpl = false;
  matcher = matcher.replace(TPL_RE, function(_, proto, value) {
    rule.isTpl = true;
    return (proto || '') + resolveTplVar(value.slice(1, -1), req);
  });
  return matcher;
}

function resolveVar(rule, vals, req) {
  var matcher = renderTpl(rule, req);
  return matcher.replace(VAR_RE, function(all, key) {
    key = getValueFor(key, vals);
    if (typeof key === 'string') {
      return rule.isTpl && key ? resolveTplVar(key, req) : key;
    }
    return all;
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

function getRule(req, list, vals, index) {
  var rule = resolveRuleList(req, list, vals, index || 0);
  resolveValue(rule, vals, req);
  return rule;
}

function getRuleList(req, list, vals) {
  return resolveRuleList(req, list, vals).map(function(rule) {
    return resolveValue(rule, vals, req);
  });
}

function resolveValue(rule, vals, req) {
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
    if (rule.isTpl) {
      rule.value = resolveTplVar(rule.value, req);
    }
  } else if ((value = getPath(matcher)) !== false) {
    rule.path = protocol + value;
    rule.files = getFiles(rule.path);
  }
  return rule;
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


function resolveRuleList(req, list, vals, index) {
  var curUrl = formatUrl(req.curUrl);
  //支持域名匹配
  var domainUrl = curUrl.replace(/^((?:https?|wss?|tunnel):\/\/[^\/]+):\d*(\/.*)/i, '$1$2');
  var isIndex = typeof index === 'number';
  index = isIndex ? index : -1;
  var results = [];
  var url = curUrl.replace(QUERY_RE, '');
  var _domainUrl = domainUrl.replace(QUERY_RE, '');
  var rule, matchedUrl, files, matcher, result, origMatcher, filePath;
  var getPathRule = function() {
    req.headers['x-whistle-relative-path'] = filePath;
    result = extend({
      files: files && files.map(function(file) {
        return join(file, filePath);
      }),
      url: join(matcher, filePath)
    }, rule);
    result.matcher = origMatcher;
    delete result.filters;
    if (isIndex) {
      return result;
    }
    results.push(result);
  };
  var getExactRule = function(relPath) {
    req.headers['x-whistle-relative-path'] = relPath;
    origMatcher = resolveVar(rule, vals, req);
    matcher = setProtocol(origMatcher, curUrl);
    result = extend({
      files: getFiles(matcher),
      url: matcher + relPath
    }, rule);
    result.matcher = origMatcher;
    delete result.filters;
    if (isIndex) {
      return result;
    }
    results.push(result);
  };

  for (var i = 0; rule = list[i]; i++) {
    var pattern = rule.isRegExp ? rule.pattern : setProtocol(rule.pattern, curUrl);
    var not = rule.not;
    var matchedRes;
    if (rule.isRegExp) {
      matchedRes = pattern.test(curUrl);
      matchedRes = not ? !matchedRes : matchedRes;
      var regExp;
      if (matchedRes) {
        regExp = {};
        if (!not) {
          for (var j = 1; j < 10; j++) {
            regExp[j] = RegExp['$' + j];
          }
        }
      }
      if (matchedRes && !matchExcludeFilters(curUrl, rule, req) && --index < 0) {
        regExp['0'] = curUrl;
        var replaceSubMatcher = function(url) {
          if (!SUB_MATCH_RE.test(url)) {
            return url;
          }
          return util.replacePattern(url, regExp);
        };
        matcher = resolveVar(rule, vals, req);
        files = getFiles(matcher);
        matcher = setProtocol(replaceSubMatcher(matcher), curUrl);
        result = extend({
          url: matcher,
          files: files && files.map(function(file) {
            return replaceSubMatcher(file);
          })
        }, rule);
        result.matcher = matcher;
        delete result.filters;
        if (isIndex) {
          return result;
        }
        results.push(result);
      }
    } else if (rule.wildcard) {
      var wildcard = rule.wildcard;
      var hostname = null; // 不能去掉
      if (wildcard.preMatch.test(curUrl)) {
        hostname = RegExp.$1;
      }
      if (hostname != null && !matchExcludeFilters(curUrl, rule, req)) {
        filePath = curUrl.substring(hostname.length);
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
            origMatcher = resolveVar(rule, vals, req);
            matcher = setProtocol(origMatcher, curUrl);
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
      matchedRes = pattern === url || pattern === curUrl;
      if ((not ? !matchedRes : matchedRes) && !matchExcludeFilters(curUrl, rule, req) && --index < 0) {
        if (result = getExactRule(getRelativePath(pattern, curUrl, rule.matcher))) {
          return result;
        }
      }
    } else if (((matchedUrl = (curUrl.indexOf(pattern) === 0)) ||
        (rule.isDomain && domainUrl.indexOf(pattern) === 0)) && !matchExcludeFilters(curUrl, rule, req)) {
      var len = pattern.length;
      origMatcher = resolveVar(rule, vals, req);
      matcher = setProtocol(origMatcher, curUrl);
      files = getFiles(matcher);
      var hasQuery = pattern.indexOf('?') !== -1;
      if ((hasQuery || (matchedUrl ? (pattern == url || isPathSeparator(url[len])) :
        (pattern == _domainUrl || isPathSeparator(_domainUrl[len]))) ||
          isPathSeparator(pattern[len - 1])) && --index < 0) {
        filePath = (matchedUrl ? curUrl : domainUrl).substring(len);
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

function resolveProperties(req, rules, vals) {
  return util.resolveProperties(getRuleList(req, rules, vals));
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
  var index = path.indexOf('?');
  var hasQuery = index !== -1;
  if (hasQuery && index === 0) {
    path = '/' + path;
  }
  var allowMatchPath = domain.length > 2 && !NON_STAR_RE.test(domain);
  if (allowMatchPath) {
    preMatch = '[^?]*';
  } else {
    if ((domain === '*' || domain === '~') && path.charAt(0) === '/') {
      preMatch += '*';
    }
    var dLen = domain.length;
    preMatch = util.escapeRegExp(preMatch).replace(DOMAIN_STAR_RE, domainToRegExp);
    if (domain[dLen - 1] !== '*' && domain.indexOf(':') === -1) {
      preMatch += '(?::\\d+)?';
    }
  }
  if (!protocol) {
    preMatch = '[a-z]+://' + preMatch;
  } else if (protocol === '//') {
    preMatch = '[a-z]+:' + preMatch;
  }
  preMatch = '^(' + preMatch + ')' + (allowMatchPath ? util.escapeRegExp(path) : '');

  return {
    preMatch: new RegExp(preMatch),
    path: path,
    hasQuery: hasQuery,
    isExact: isExact
  };
}
function parseRule(rulesMgr, pattern, matcher, raw, root, options) {
  if (isNegativePattern(matcher)) {
    return;
  }
  var regUrl = regUrlCache[pattern];
  var rawPattern = pattern;
  var noSchema;
  var isRegExp, not, port, protocol, isExact;
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
    if (NO_SCHEMA_RE.test(pattern)) {
      noSchema = true;
      pattern = pattern.substring(2);
    }
    if (!pattern) {
      return;
    }
    if (isPortPattern) {
      isRegExp = true;
      pattern = new RegExp('^[\\w]+://[^/?]+' + pattern + '/');
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
    if (matcher[1] === '/') {
      protocol = 'rule';
    } else {
      matcher = 'file://' + matcher;
      protocol = 'file';
    }
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
  var rules = rulesMgr._rules;
  var list = rules[protocol];
  if (!list) {
    protocol = 'rule';
    list = LOCAL_RULE_RE.test(matcher) ? rules._localRule : rules.rule;
  } else if (!isIp && protocol == 'host' && PORT_RE.test(matcher)) {
    matcher = 'host://' + (RegExp.$1 || RegExp.$2);
    port = RegExp.$3;
  }
  var rule = {
    not: not,
    name: protocol,
    isTpl: protocol === 'log' || protocol === 'weinre' ? false : undefined,
    root: root,
    wildcard: wildcard,
    isRegExp: isRegExp,
    isExact: isExact,
    protocol: isRegExp ? null : util.getProtocol(pattern),
    pattern: isRegExp ? pattern : formatUrl(pattern),
    matcher: matcher,
    port: port,
    raw: raw,
    isDomain: !isRegExp && !not && (noSchema ? pattern : util.removeProtocol(rawPattern, true)).indexOf('/') == -1,
    rawPattern: rawPattern,
    filters: options.filters
  };
  if (options.hasBodyFilter) {
    rules._bodyFilters.push(rule);
  }
  list.push(rule);
}

function parse(rulesMgr, text, root, append) {
  !append && protoMgr.resetRules(rulesMgr._rules);
  if (Array.isArray(text)) {
    text.forEach(function(item) {
      item && parseText(rulesMgr, item.text, item.root);
    });
  } else {
    parseText(rulesMgr, text, root);
  }
}

function isPattern(item) {
  return PORT_PATTERN_RE.test(item) || NO_SCHEMA_RE.test(item) || isExactPattern(item) || isRegUrl(item) ||
  isNegativePattern(item) || WEB_PROTOCOL_RE.test(item) || util.isRegExp(item);
}

function isHost(item) {
  return net.isIP(item) || HOST_RE.test(item);
}

function indexOfPattern(list) {
  var ipIndex = -1;
  for (var i = 0, len = list.length; i < len; i++) {
    var item = list[i];
    if (isPattern(item)) {
      return i;
    }

    if (!util.hasProtocol(item)) {
      if (!isHost(item)) {
        return i;
      } else if (ipIndex === -1) {
        ipIndex = i;
      }
    }
  }
  return ipIndex;
}

function resolveFilterPattern(matcher) {
  var not, isInclude, filter, caseIns, wildcard;
  if (PATTERN_FILTER_RE.test(matcher)) {
    filter = RegExp.$1;
    caseIns = RegExp.$2;
    not = filter[0] === '!';
    if (not) {
      filter = filter.substring(1);
    }
    if (filter[0] === '/') {
      filter = filter.substring(1);
    }
    return filter ? {
      not: not,
      filter: filter,
      caseIns: caseIns
    } : false;
  } else if (FILTER_RE.test(matcher)) {
    filter = RegExp.$1;
    if (!filter || filter === '!') {
      return false;
    }
    not = isInclude = matcher[0] === 'i';
    if (filter[0] === '!') {
      not = !not;
      filter = filter.substring(1);
    }
    if (util.isRegExp(filter)) {
      filter = RegExp.$1;
      caseIns = RegExp.$2;
      return {
        not: not,
        isInclude: isInclude,
        filter: filter,
        caseIns: caseIns
      };
    }
    if (filter[0] === '/' && filter[1] !== '/') {
      wildcard = '/';
    } else if (WILD_FILTER_RE.test(filter)) {
      wildcard = RegExp.$1;
    }
  } else if (PATTERN_WILD_FILTER_RE.test(matcher)) {
    not = RegExp.$1 || '';
    wildcard = RegExp.$2;
  } else {
    return;
  }
  if (wildcard) {
    matcher = filter || matcher.substring(matcher.indexOf('://') + 3 + not.length);
    var path = util.escapeRegExp(matcher.substring(wildcard.length));
    if (path.indexOf('*') !== -1) {
      path = path.replace(STAR_RE, pathToRegExp);
    } else if (path && path[path.length - 1] !== '/') {
      path += '(?:[/?]|$)';
    }
    return {
      not: not,
      isInclude: isInclude,
      filter: '^[a-z]+://[^/?]+/' + path
    };
  }
  var result = isRegUrl('^' + filter);
  if (result) {
    result.not = not;
    result.isInclude = isInclude;
    return result;
  }
}

function resolveMatchFilter(list) {
  var matchers = [];
  var filters, filter, not, isInclude, hasBodyFilter, orgVal;
  list.forEach(function(matcher) {
    if (PROPS_FILTER_RE.test(matcher)) {
      filters = filters || [];
      var propName = RegExp.$1;
      var value = RegExp.$2;
      not = isInclude = matcher[1] === 'n';
      if (value[0] === '!') {
        not = !not;
        value = value.substring(1);
        if (!value) {
          return;
        }
      }
      var pattern;
      var isIp = propName === 'i' || propName === 'ip';
      var isClientIp, isServerIp;
      if (!isIp) {
        isClientIp= propName[0] === 'c';
        isServerIp = !isClientIp && (propName === 'serverIp' || propName === 'serverIP');
      }
      if (isIp || isClientIp || isServerIp) {
        pattern = util.toRegExp(value);
        if (!pattern && !net.isIP(value)) {
          return;
        }
        if (isIp) {
          propName = pattern ? 'iPattern' : 'ip';
        } else if (isClientIp) {
          propName = pattern ? 'clientPattern' : 'clientIp';
        } else if (isServerIp) {
          propName = pattern ? 'serverPattern' : 'serverIp';
        }
        value = pattern || value;
      } else if (propName[0] === 'm') {
        pattern = util.toRegExp(value, true);
        propName = pattern ? 'mPattern' : 'method';
        value = pattern || value.toUpperCase();
      } else if (propName === 's' || propName === 'statusCode') {
        pattern = util.toRegExp(value);
        propName = pattern ? 'sPattern' : 'statusCode';
        value = pattern || value.toLowerCase();
      } else if (propName === 'b' || propName === 'body') {
        hasBodyFilter = true;
        pattern = util.toRegExp(value);
        if (pattern) {
          propName = 'bodyPattern';
          value = pattern;
        } else {
          propName = 'body';
          value = {
            orgVal: util.encodeURIComponent(value).toLowerCase(),
            value: value.toLowerCase()
          };
        }
      } else {
        var index = value.indexOf('=');
        if (index === -1 || !index || index === value.length - 1) {
          return;
        }
        var key = value.substring(0, index).toLowerCase();
        var lastIndex = key.length - 1;
        if (key[lastIndex] === '!') {
          key = key.substring(0, lastIndex);
          if (!key) {
            return;
          }
          not = !not;
        }
        orgVal = value.substring(index + 1);
        value = { key: key };
        if (pattern = util.toRegExp(orgVal)) {
          value.hPattern = pattern;
        } else {
          orgVal = value.orgVal = orgVal.toLowerCase();
          value.value = util.encodeURIComponent(orgVal);
        }
        switch(propName[2]) {
        case 'q':
          propName = 'reqHeader';
          break;
        case 's':
          propName = 'resHeader';
          break;
        default:
          propName = 'header';
        }
      }
      filter = { not: not, isInclude: isInclude };
      filter[propName] = value;
      return filters.push(filter);
    }
    var result = resolveFilterPattern(matcher);
    if (result === false) {
      return;
    } else if (!result) {
      matchers.push(matcher);
      return;
    }
    if (result.pattern) {
      filters = filters || [];
      result.raw = matcher;
      return filters.push(result);
    }
    filter = '/' + result.filter + '/' + (result.caseIns ? 'i' : '');
    if (filter = util.toRegExp(filter)) {
      filters = filters || [];
      filters.push({
        raw: matcher,
        pattern: filter,
        not: result.not
      });
    }
  });
  return {
    hasBodyFilter: hasBodyFilter,
    matchers: matchers,
    filters: filters
  };
}

function parseText(rulesMgr, text, root) {
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
    var matchers = result.matchers;
    if (patternIndex > 0) {
      //supports: operator-uri1 operator-uriX pattern1 pattern2 ... patternN
      var opList = [pattern];
      var patternList = matchers.filter(function(p) {
        if (isPattern(p) || isHost(p) || !util.hasProtocol(p)) {
          return true;
        }
        opList.push(p);
      });
      opList.forEach(function(matcher) {
        patternList.forEach(function(pattern) {
          parseRule(rulesMgr, pattern, matcher, raw, root, result);
        });
      });
    } else {
      //supports: pattern operator-uri1 operator-uri2 ... operator-uriN
      matchers.forEach(function(matcher) {
        parseRule(rulesMgr, pattern, matcher, raw, root, result);
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

function getFilterResult(result, filter) {
  return result == null ? false : (filter.not ? !result : result);
}
function matchFilter(url, filter, req) {
  var result;
  if (filter.pattern) {
    result = filter.pattern.test(url);
    return getFilterResult(result, filter);
  }
  if (!req) {
    return false;
  }
  var filterProp = function(value, expectVal, pattern) {
    if (value == null) {
      return;
    }
    if (expectVal) {
      result = value == expectVal;
      return true;
    }
    if (pattern) {
      result = pattern.test(value);
      return true;
    }
  };
  if (filterProp(req.method, filter.method, filter.mPattern)) {
    return getFilterResult(result, filter);
  }
  if (filterProp(req.statusCode, filter.statusCode, filter.sPattern)) {
    return getFilterResult(result, filter);
  }
  if (filterProp(req.clientIp, filter.ip, filter.iPattern)) {
    return getFilterResult(result, filter);
  }
  if (filterProp(req.hostIp, filter.ip, filter.iPattern)) {
    return getFilterResult(result, filter);
  }
  if (filterProp(req.clientIp, filter.clientIp, filter.clientPattern)) {
    return getFilterResult(result, filter);
  }
  if (filterProp(req.hostIp, filter.serverIp, filter.serverPattern)) {
    return getFilterResult(result, filter);
  }

  var reqBody = req._reqBody;
  if (typeof reqBody === 'string' && (filter.bodyPattern || filter.body)) {
    if (filter.bodyPattern) {
      result = filter.bodyPattern.test(reqBody);
    } else {
      reqBody = reqBody.toLowerCase();
      result = reqBody.indexOf(filter.body.value) !== -1
        || reqBody.indexOf(filter.body.orgVal) !== -1;
    }

    return filter.not ? !result : result;
  }

  var filterHeader = function(headers, filterVal) {
    if (!filterVal || !headers) {
      return;
    }
    var value = String(headers[filterVal.key] || '');
    if (filterVal.hPattern) {
      result = filterVal.hPattern.test(value);
    } else {
      value = value.toLowerCase();
      result = value.indexOf(filterVal.value) !== -1 || value.indexOf(filterVal.orgVal) !== -1;
    }
    return true;
  };
  if (filterHeader(req.headers, filter.header)) {
    return getFilterResult(result, filter);
  }
  if (filterHeader(req.resHeaders, filter.header)) {
    return getFilterResult(result, filter);
  }
  if (filterHeader(req.headers, filter.reqHeader)) {
    return getFilterResult(result, filter);
  }
  if (filterHeader(req.resHeaders, filter.resHeader)) {
    return getFilterResult(result, filter);
  }
  return false;
}

function matchExcludeFilters(url, rule, options) {
  var filters = rule.filters;
  var hasIncludeFilter;
  if (filters) {
    for (var i = 0, len = filters.length; i < len; i++) {
      var filter = filters[i];
      var result = matchFilter(url, filter, options);
      hasIncludeFilter = hasIncludeFilter || filter.isInclude;
      if (filter.isInclude ? !result : result) {
        return result;
      }
    }
  }
  return hasIncludeFilter;
}

function Rules(values) {
  this._rules = protoMgr.getRules();
  this._xRules = [];
  this._orgValues = this._values = values || {};
}

var proto = Rules.prototype;

function resolveInlineValues(str) {
  str = str && str.replace(CONTROL_RE, '').trim();
  if (!str || str.indexOf('```') === -1) {
    return str;
  }
  return str.replace(MULTI_LINE_VALUE_RE, function(_, __, key, value) {
    inlineValues = inlineValues || {};
    if (!inlineValues[key]) {
      inlineValues[key] = value;
    }
    return '';
  });
}

function resolveInlineValuesFn(item) {
  item.text = resolveInlineValues(item.text);
  return item;
}

function trimInlineValues(text) {
  return Array.isArray(text) ? text.map(resolveInlineValuesFn) : resolveInlineValues(text);
}

proto.parse = function(text, root, _inlineValues) {
  var item = {
    first: true,
    text: text,
    root: root
  };
  this._inlineValues = _inlineValues;
  this.disabled = !arguments.length;
  if (this._rawText) {
    if (this._rawText[0].first) {
      this._rawText.shift();
    }
    this._rawText.unshift(item);
  } else {
    this._rawText = [item];
  }
  inlineValues = _inlineValues ? extend({}, _inlineValues) : null;
  parse(this, trimInlineValues(text), root);
  if (!this.disabled) {
    for (var i = 1, len = this._rawText.length; i < len; i++) {
      item = this._rawText[i];
      parse(this, trimInlineValues(item.text), item.root, true);
    }
  }
  if (inlineValues) {
    this._values = extend({}, this._orgValues, inlineValues);
    inlineValues = null;
  } else {
    this._values = this._orgValues;
  }
};

proto.clearAppend = function() {
  if (this._rawText && this._rawText[0].first) {
    var item = this._rawText[0];
    inlineValues = this._inlineValues ? extend({}, this._inlineValues) : null;
    !this.disabled && parse(this, trimInlineValues(item.text), item.root);
    this._rawText = [item];
    if (inlineValues) {
      this._values = extend({}, this._orgValues, inlineValues);
      inlineValues = null;
    }
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
    !this.disabled && parse(this, trimInlineValues(text), root, true);
    if (inlineValues) {
      extend(this._values, inlineValues);
      inlineValues = null;
    }
  } else {
    this._rawText = [item];
  }
};

proto.resolveHost = function(req, callback, pluginRulesMgr, rulesFileMgr, headerRulesMgr) {
  if (!req.curUrl) {
    return callback();
  }
  var host = this.getHost(req, pluginRulesMgr, rulesFileMgr, headerRulesMgr);
  if (host) {
    return callback(null, util.removeProtocol(host.matcher, true), host.port, host);
  }
  this.lookupHost(req, callback);
};

proto.lookupHost = function(req, callback) {
  req.curUrl = formatUrl(util.setProtocol(req.curUrl));
  var options = url.parse(req.curUrl);
  if (options.hostname === '::1') {
    return callback(null, '127.0.0.1');
  }
  lookup(options.hostname, callback, allowDnsCache && !this.resolveDisable(req).dnsCache);
};

var ignoreHost = function(req, rulesMgr) {
  if (!rulesMgr) {
    return false;
  }
  var ignore = rulesMgr.resolveFilter(req);
  return ignore.host || ignore.hosts || ignore['ignore|host'] || ignore['ignore|hosts'];
};
proto.getHost = function(req, pluginRulesMgr, rulesFileMgr, headerRulesMgr) {
  var curUrl = formatUrl(util.setProtocol(req.curUrl));
  req.curUrl = curUrl;
  var filterHost = ignoreHost(req, this) || ignoreHost(req, pluginRulesMgr)
    || ignoreHost(req, rulesFileMgr) || ignoreHost(req, headerRulesMgr);
  var vals = this._values;
  if (filterHost) {
    return;
  }
  var host = (pluginRulesMgr && getRule(req, pluginRulesMgr._rules.host, pluginRulesMgr._values))
  || getRule(req, this._rules.host, vals)
  || (rulesFileMgr && getRule(req, rulesFileMgr._rules.host, vals))
  || (headerRulesMgr && getRule(req, headerRulesMgr._rules.host, vals));
  var matcher = util.rule.getMatcher(host);
  if (matcher && PORT_RE.test(matcher)) {
    host.matcher = 'host://' + (RegExp.$1 || RegExp.$2);
    host.port = RegExp.$3 || host.port;
  }
  return host;
};

proto.resolveFilter = function(req) {
  var filter = resolveProperties(req, this._rules.filter, this._values);
  var ignore = resolveProperties(req, this._rules.ignore, this._values);
  util.resolveFilter(ignore, filter);
  delete filter.filter;
  delete filter.ignore;
  delete filter['ignore|filter'];
  delete filter['ignore|ignore'];
  return filter;
};
proto.resolveDisable = function(req) {
  return resolveProperties(req, this._rules.disable, this._values);
};
var pluginProtocols = ['enable', 'plugin'];
proto.resolveRules = function(req) {
  var rule;
  var rules = this._rules;
  var _rules = {};
  var vals = this._values;
  var filter = this.resolveFilter(req);
  (req.isPluginReq ? pluginProtocols : protocols).forEach(function(name) {
    if (name !== 'pipe' && (name === 'proxy' || name === 'rule' || name === 'plugin'
      || !filter[name]) && (rule = getRule(req, rules[name], vals))) {
      _rules[name] = rule;
    }
  });
  multiMatchs.forEach(function(name) {
    rule = _rules[name];
    if (rule) {
      rule.list = getRuleList(req, rules[name], vals);
      util.filterRepeatPlugin(rule);
    }
  });
  util.ignoreRules(_rules, filter);
  return _rules;
};

proto.resolveEnable = function(req) {
  return resolveProperties(req, this._rules.enable, this._values);
};

proto.resolvePipe = function(req) {
  if (req.isPluginReq) {
    return;
  }
  req.curUrl = req.curUrl || req.fullUrl;
  var filter = this.resolveFilter(req);
  if (util.isIgnored(filter, 'pipe')) {
    return;
  }
  return getRule(req, this._rules.pipe, this._values);
};

proto.resolvePac = function(req) {
  req.curUrl = req.curUrl || req.fullUrl;
  var filter = this.resolveFilter(req);
  if (util.isIgnored(filter, 'pac')) {
    return;
  }
  return getRule(req, this._rules.pac, this._values);
};

proto.hasReqScript = function(req) {
  return req.isPluginReq ? null : getRule(req, this._rules.rulesFile, this._values);
};

proto.resolveProxy = function resolveProxy(req, isWebUI) {
  var filter = isWebUI ? null : this.resolveFilter(req);
  if (filter && util.isIgnored(filter, 'proxy')) {
    return;
  }
  var proxy = getRule(req, this._rules.proxy, this._values);
  if (filter && proxy) {
    var matcher = proxy.matcher;
    if (util.isIgnored(filter, 'socks')) {
      if (matcher.indexOf('socks://') === 0) {
        return;
      }
    } if (util.isIgnored(filter, 'https-proxy')) {
      if (matcher.indexOf('https-proxy://') === 0) {
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

proto.resolveLocalRule = function(req) {
  return getRule(req, this._rules._localRule);
};
proto.resolveBodyFilter = function(req) {
  return req.isPluginReq ? null : getRule(req, this._rules._bodyFilters);
};

Rules.disableDnsCache = function() {
  allowDnsCache = false;
};

module.exports = Rules;

