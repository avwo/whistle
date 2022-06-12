var url = require('url');
var net = require('net');
var extend = require('extend');
var util = require('../util');
var rulesUtil = require('./util');
var lookup = require('./dns');
var protoMgr = require('./protocols');
var config = require('../config');

var rules = rulesUtil.rules;
var values = rulesUtil.values;
var allowDnsCache = true;
var SUB_MATCH_RE = /\$[&\d]/;
var SPACE_RE = /\s+/g;
var MULTI_TO_ONE_RE = /^\s*line`\s*[\r\n]([\s\S]*?)[\r\n]\s*`\s*?$/gm;
var MULTI_LINE_VALUE_RE =
  /^[^\n\r\S]*(```+)[^\n\r\S]*(\S+)[^\n\r\S]*[\r\n]([\s\S]*?)[\r\n][^\n\r\S]*\1\s*$/gm;
var WEB_PROTOCOL_RE = /^(?:https?|wss?|tunnel):\/\//;
var PORT_RE = /^(x?hosts?:\/\/)(?:([\w.-]*)|\[([:\da-f.]+)\])(?::(\d+))?$/i;
var PLUGIN_RE = /^(?:plugin|whistle)\.([a-z\d_\-]+:\/\/[\s\S]*)/;
var protocols = protoMgr.protocols;
var reqProtocols = protoMgr.reqProtocols;
var pureResProtocols = protoMgr.pureResProtocols;
var multiMatchs = protoMgr.multiMatchs;
var aliasProtocols = protoMgr.aliasProtocols;
var FILE_RE = /^(?:[a-z]:(?:\\|\/[^/])|\/[^/])/i;
var PROXY_RE =
  /^x?(socks|proxy|https?-proxy|internal-proxy|internal-https?-proxy|https2http-proxy|http2https-proxy):\/\//;
var VAR_RE = /\${([^{}]+)}/g;
var NO_SCHEMA_RE = /^\/\/[^/]/;
var WILDCARD_RE = /^(\$?((?:https?|wss?|tunnel):\/\/)?([^/?]+))/;
var RULE_KEY_RE = /^\$\{(\S+)\}$/;
var VALUE_KEY_RE = /^\{(\S+)\}$/;
var LINE_END_RE = /\n|\r\n|\r/;
var LOCAL_RULE_RE =
  /^https?:\/\/local\.(?:whistlejs\.com|wproxy\.org)(:realPort)?(?:\/|\?|$)/;
var PATH_RE = /^<.*>$/;
var VALUE_RE = /^\(.*\)$/;
var REG_URL_RE = /^((?:[\w.*-]+:|\*+)?\/\/)?([^/?]*)/;
var LIKE_REG_URL_RE = /^(?:(?:https?|wss?|tunnel):\/\/)?\*+\/[^?*]*\*/;
var LIKE_REG_URL_RE2 =
  /^(?:(?:https?|wss?|tunnel):\/\/)?\.[^./?]+\.[^/?]+\/[^?*]*\*/;
var DOT_DOMAIN_RE = /^\.[^./?]+\.[^/?]/;
var REG_URL_SYMBOL_RE = /^(\^+)/;
var PATTERN_FILTER_RE = /^(?:filter|ignore):\/\/(.+)\/(i)?$/;
var LINE_PROPS_RE = /^lineProps:\/\/(.*)$/;
var FILTER_RE = /^(?:excludeFilter|includeFilter):\/\/(.*)$/;
var PROPS_FILTER_RE =
  /^(?:filter|excludeFilter|includeFilter|ignore):\/\/(m(?:ethod)?|i(?:p)?|h(?:eader)?|s(?:tatusCode)?|from|b(?:ody)?|clientIp|clientIP|clientPort|remoteAddress|remotePort|serverIp|serverIP|serverPort|re[qs](?:H(?:eaders?)?)?):(.+)$/;
var PURE_FILTER_RE =
  /^(?:excludeFilter|includeFilter):\/\/(statusCode|from|clientIp|clientIP|clientPort|remoteAddress|remotePort|serverIp|serverIP|serverPort|host|re[qs](?:H(?:eaders?)?)?)[.=](.+)$/;
var PATTERN_WILD_FILTER_RE = /^(?:filter|ignore):\/\/(!)?(\*+\/)/;
var WILD_FILTER_RE = /^(\*+\/)/;
var regUrlCache = {};
var hostCache = {};
var NON_STAR_RE = /[^*]/;
var DOMAIN_STAR_RE = /([*~]+)(\\.)?/g;
var STAR_RE = /\*+/g;
var PORT_PATTERN_RE = /^!?:\d{1,5}$/;
var QUERY_RE = /[?#].*$/;
var COMMENT_RE = /#.*$/;
var TPL_RE = /^((?:[\w.-]+:)?\/\/)?(`.*`)$/;
// url:  protocol, host, port, hostname, search, query, pathname, path, href, query.key
// req|res: ip, method, statusCode, headers?.key, cookies?.key
var PLUGIN_NAME_RE =
  /^[a-z\d_\-]+(?:\.g?(?:all)?var(?:\$|\d*))?(?:\.replace\(.+\))?$/i;
var VAR_INDEX_RE = /^([a-z\d_\-]+)\.(g)?(all)?var(\$|\d*)/i;
var TPL_VAR_RE =
  /(\$)?\$\{(\{)?(id|reqId|whistle|now|host|port|realPort|realHost|version|url|hostname|query|search|queryString|searchString|path|pathname|clientId|localClientId|ip|clientIp|clientPort|remoteAddress|remotePort|serverIp|serverPort|method|status(?:Code)|reqCookies?|resCookies?|re[qs]H(?:eaders?)?)(?:\.([^{}]+))?\}(\})?/gi;
var REPLACE_PATTERN_RE = /(^|\.)replace\((.+)\)$/i;
var SEP_RE = /^[?/]/;
var COMMA1_RE = /\\,/g;
var COMMA2_RE = /\\\\,/g;
var G_CR_RE = /\r/g;
var G_LF_RE = /\n/g;
var SUFFIX_RE = /^\\\.[\w-]+$/;
var DOT_PATTERN_RE = /^\.[\w-]+(?:[?$]|$)/;
var inlineValues;
var CONTROL_RE =
  /[\u001e\u001f\u200e\u200f\u200d\u200c\u202a\u202d\u202e\u202c\u206e\u206f\u206b\u206a\u206d\u206c]+/g;
var ENABLE_PROXY_RE =
  /\bproxy(?:Host|First|Tunnel)|clientId|multiClient|singleClient\b/i;
var PLUGIN_VAR_RE = /^%([a-z\d_\-]+)([=.])([^\s]*)/;
var EXACT_IGNORE_RE = /^ignore:\/\/(pattern|matcher|operator)[=:](.+)$/;
var EXACT_SKIP_RE = /^(pattern|matcher|operator)[=:](.+)$/;
var NO_PROTO_RE = /[^\w!*|.-]/;
var SKIP_RE = /^skip:\/\//;
var SUB_VAR_RE = /\$\{RegExp\.\$([&\d])\}/g;

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

function isRegUrl(url, isCheck) {
  var result = regUrlCache[url];
  if (result) {
    return isCheck ? result : extend({}, result);
  }
  var oriUrl = url;
  var not = isNegativePattern(url);
  if (not) {
    url = url.substring(1);
  }
  if (DOT_PATTERN_RE.test(url)) {
    url = '^' + url;
  }
  var hasStartSymbol = REG_URL_SYMBOL_RE.test(url);
  var hasEndSymbol, ignoreCase, startWithDot;
  if (hasStartSymbol) {
    ignoreCase = RegExp.$1.length;
    url = url.substring(ignoreCase);
    hasEndSymbol = /\$$/.test(url);
    if (hasEndSymbol) {
      url = url.slice(0, -1);
    }
    ignoreCase = ignoreCase === 1;
  } else {
    startWithDot = LIKE_REG_URL_RE2.test(url);
    if (startWithDot || LIKE_REG_URL_RE.test(url)) {
      ignoreCase = hasStartSymbol = true;
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
  if (startWithDot) {
    domain = domain.substring(1);
  }
  domain = util.escapeRegExp(domain);
  if (domain.length > 2 && !NON_STAR_RE.test(domain)) {
    domain = '([^?]*)';
  } else if (domain) {
    domain = domain.replace(DOMAIN_STAR_RE, domainToRegExp);
  } else {
    domain = '[^/?]*';
  }
  if (startWithDot) {
    domain = '(?:[^/?.]*.)?' + domain;
  }
  if (pathname) {
    pathname = util.escapeRegExp(pathname).replace(STAR_RE, pathToRegExp);
  } else if (hasStartSymbol && SUFFIX_RE.test(domain)) {
    pathname = '/[^?]+' + domain + (hasEndSymbol || query ? '' : '(?:\\??.*)$');
    domain = '[^/?]+';
  } else if (query || hasEndSymbol) {
    pathname = '/';
  }
  query =
    pathname +
    (query ? util.escapeRegExp(query).replace(STAR_RE, queryToRegExp) : '');
  var pattern = '^' + protocol + domain + query + (hasEndSymbol ? '$' : '');
  try {
    result = regUrlCache[oriUrl] = {
      not: not,
      pattern: new RegExp(pattern, ignoreCase ? 'i' : '')
    };
  } catch (e) {}
  return result;
}

function formatShorthand(url) {
  if (NO_SCHEMA_RE.test(url)) {
    return url;
  }

  if (
    url === '{}' ||
    VALUE_KEY_RE.test(url) ||
    PATH_RE.test(url) ||
    VALUE_RE.test(url)
  ) {
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

  if (PLUGIN_VAR_RE.test(url)) {
    if (RegExp.$2 === '.') {
      url = url.replace('.', '=');
    }
    return url.replace('%', 'P://');
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
  return /^x?((raw)?file|tpl|jsonp|dust):\/\//.test(path)
    ? util.removeProtocol(path, true).split('|')
    : null;
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
  var sep =
    firstLen < 2 ||
    !secondLen ||
    firstQuery[firstLen - 1] === '&' ||
    secondQuery[0] === '&'
      ? ''
      : '&';
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
      first = startWithSep
        ? first.substring(0, lastIndex) + second
        : first + second;
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
  lines.forEach(function (line) {
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
  return (key && obj && obj[key.toLowerCase()]) || '';
}

function resolveUrlVar(req, key, escape) {
  var url = req.fullUrl || req.curUrl;
  if (!key) {
    return url;
  }
  var options = req.__options || req.options;
  if (!options || options.href !== url) {
    options = req.__options = util.parseUrl(url);
    req.__query = req.__query$ = '';
  }
  if (key.indexOf('query.') !== 0 || !options.query) {
    if (key === 'actualPort' || key === 'realPort') {
      return options['port'] || (options.protocol === 'https:' || options.protocol === 'wss:' ? '443' : '80');
    }
    return options[key] || '';
  }
  var queryKey = '__query' + (escape ? '$' : '');
  var query = req[queryKey];
  if (!query) {
    query = req[queryKey] = util.parseQuery(options.query, null, null, escape);
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
    cookie.forEach(function (c) {
      c = util.parseQuery(c, '; ', null, escape);
      Object.keys(c).forEach(function (key) {
        var item = {};
        switch (key.toLowerCase()) {
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

function resolveResHeadersVar(req, key) {
  return resolvePropValue(req.resHeaders, key);
}

function getPluginVar(vars, index) {
  if (!vars) {
    return '';
  }
  if (vars && index === '$') {
    index = vars.length - 1;
  }
  return (vars && vars[index || 0]) || '';
}

function resolveRuleValue(req, key) {
  var curRules = key && req.rules;
  if (curRules) {
    if (VAR_INDEX_RE.test(key)) {
      var shortName = RegExp.$1;
      var isGlobal = RegExp.$2;
      var isAll = RegExp.$3;
      var index = RegExp.$4 || 0;
      var gVars = req._globalPluginVars && req._globalPluginVars[shortName];
      var vars = req._pluginVars && req._pluginVars[shortName];
      if (isAll) {
        if (vars && gVars) {
          vars = isGlobal ? gVars.concat(vars) : vars.concat(gVars);
        }
        return getPluginVar(vars || gVars, index);
      }
      return getPluginVar(isGlobal ? gVars : vars, index);
    }
    var plugin = curRules.plugin;
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
    matcher = curRules.rule && curRules.rule.matcher;
    if (matcher && !matcher.indexOf(key)) {
      return matcher.substring(key.length);
    }
  }
  return '';
}

function resolveVarValue(req, escape, name, key) {
  var lname = name.toLowerCase();
  switch (lname) {
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
    return key ? '' : resolveUrlVar(req, 'search', escape) || '?';
  case 'query':
    key = key ? 'query.' + key : 'query';
    return resolveUrlVar(req, key, escape);
  case 'url':
    return resolveUrlVar(req, key, escape);
  case 'port':
    return config.port;
  case 'host':
    return config.host || '';
  case 'realport':
    return config.realPort || config.port;
  case 'realhost':
    return config.realHost || config.host || '';
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
  case 'clientid':
    return req._origClientId || util.getClientId(req.headers);
  case 'clientport':
    return req.clientPort || '';
  case 'localclientid':
    return config.clientId;
  case 'statuscode':
  case 'status':
    return resolveStatusCodeVar(req, key);
  case 'serverip':
    return resolveServerIpVar(req, key);
  case 'serverport':
    return req.serverPort || '';
  case 'reqh':
  case 'reqheader':
  case 'reqheaders':
    return resolvePropValue(req.headers, key);
  case 'hostname':
    return util.hostname();
  case 'remoteaddress':
    return req._remoteAddr || '';
  case 'remoteport':
    return req._remotePort || '0';
  default:
    return resolveResHeadersVar(req, key);
  }
}

function resetComma(str) {
  return str && str.replace(G_CR_RE, ',').replace(G_LF_RE, '\\,');
}

function resolveTplVar(value, req) {
  return value.replace(TPL_VAR_RE, function (all, escape, lb, name, key, rb) {
    if (
      (lb && !rb) ||
      (name === 'whistle' && (!key || !PLUGIN_NAME_RE.test(key)))
    ) {
      return all;
    }
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
    if (typeof val !== 'string') {
      val = val == null ? '' : val + '';
    }
    if (!val || !pattern) {
      val = pattern ? val : val || replacement;
    } else if (!regPattern || !SUB_MATCH_RE.test(replacement)) {
      val = val.replace(regPattern || pattern, replacement);
    } else {
      val = val.replace(regPattern, function () {
        return util.replacePattern(replacement, arguments);
      });
    }
    if (val && lb) {
      val = util.encodeURIComponent(val);
    }
    return val + (!lb && rb ? '}' : '');
  });
}

function renderTpl(rule, req) {
  var matcher = rule.matcher;
  if (rule.isTpl === false) {
    return matcher;
  }
  rule.isTpl = false;
  matcher = matcher.replace(TPL_RE, function (_, proto, value) {
    rule.isTpl = true;
    return (proto || '') + resolveTplVar(value.slice(1, -1), req);
  });
  return matcher;
}

function resolveVar(rule, vals, req) {
  var matcher = renderTpl(rule, req);
  return matcher.replace(VAR_RE, function (all, key) {
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
  if (vals && key in vals) {
    var val = vals[key];
    val = vals[key] = val && typeof val == 'object' ? JSON.stringify(val) : val;
    return val;
  }
  return values.get(key);
}

function getRule(req, list, vals, index, isFilter, host) {
  var rule = resolveRuleList(req, list, vals, index || 0, isFilter, null, host);
  resolveValue(rule, vals, req);
  return rule;
}

function getRuleList(req, list, vals, isEnableProxy) {
  return resolveRuleList(req, list, vals, isEnableProxy).map(function (rule) {
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
  var regExp = rule.regExp;
  delete rule.regExp;
  matcher = matcher.substring(index);
  var key = getKey(matcher);
  if (key) {
    rule.key = key;
  }
  var value = getValueFor(key, vals);
  if (value == null) {
    value = false;
    regExp = null;
  }
  if (value !== false || (value = getValue(matcher)) !== false) {
    rule.value = protocol + value;
    if (rule.isTpl && regExp) {
      rule.value = rule.value.replace(SUB_VAR_RE, function(_, index) {
        index = index === '&' ? 0 : index;
        return regExp[index] || '';
      });
    }
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

function removeFilters(rule) {
  var filters = rule.filters;
  if (filters) {
    if (filters.curFilter) {
      rule.filter = filters.curFilter;
    }
    delete rule.filters;
  }
}

function replaceSubMatcher(url, regExp) {
  if (!regExp || !SUB_MATCH_RE.test(url)) {
    return url;
  }
  return util.replacePattern(url, regExp);
}

function resolveRuleList(req, list, vals, index, isFilter, isEnableProxy, host) {
  var curUrl = formatUrl(req.curUrl);
  var notHttp = list.isRuleProto && curUrl[0] !== 'h';
  //支持域名匹配
  var domainUrl = curUrl.replace(
    /^((?:https?|wss?|tunnel):\/\/[^\/]+):\d*(\/.*)/i,
    '$1$2'
  );
  var isIndex = typeof index === 'number';
  index = isIndex ? index : -1;
  var results = [];
  var url = curUrl.replace(QUERY_RE, '');
  var _domainUrl = domainUrl.replace(QUERY_RE, '');
  var rule, matchedUrl, files, matcher, result, origMatcher, filePath;
  var getPathRule = function () {
    result = extend(
      {
        files: files,
        url: join(matcher, filePath)
      },
      rule
    );
    if (files && filePath) {
      result.files = files.map(function (file) {
        return join(file, filePath);
      });
      result.rawFiles = files;
    }
    result.matcher = origMatcher;
    removeFilters(result);
    if (isIndex) {
      return result;
    }
    results.push(result);
  };
  var getExactRule = function (relPath, regObj) {
    origMatcher = resolveVar(rule, vals, req);
    origMatcher = replaceSubMatcher(origMatcher, regObj);
    matcher = setProtocol(origMatcher, curUrl);
    result = extend(
      {
        files: getFiles(matcher),
        url: matcher + relPath
      },
      rule
    );
    result.matcher = origMatcher;
    removeFilters(result);
    if (isIndex) {
      return result;
    }
    results.push(result);
  };
  var checkFilter = function () {
    if (notHttp && protoMgr.isFileProxy(rule.matcher)) {
      return false;
    }
    return (isFilter || !matchExcludeFilters(curUrl, rule, req)) && (host == null || util.checkProxyHost(rule, host));
  };

  for (var i = 0; (rule = list[i]); i++) {
    if ((isEnableProxy && !ENABLE_PROXY_RE.test(rule.matcher)) ||
      (req._skipProps && (util.exactIgnore(req._skipProps, rule) || util.checkSkip(req._skipProps, rule, curUrl)))) {
      continue;
    }
    var pattern = rule.isRegExp
      ? rule.pattern
      : setProtocol(rule.pattern, curUrl);
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
      if (matchedRes && checkFilter() && --index < 0) {
        regExp['0'] = curUrl;
        matcher = resolveVar(rule, vals, req);
        // 支持 $x 包含 `|` 的情形
        matcher = setProtocol(replaceSubMatcher(matcher, regExp), curUrl);
        files = getFiles(matcher);
        result = extend({ url: matcher, files: files }, rule);
        result.matcher = matcher;
        result.regExp = regExp;
        removeFilters(result);
        if (isIndex) {
          return result;
        }
        results.push(result);
      }
    } else if (rule.wildcard) {
      var wildcard = rule.wildcard;
      var hostname = null; // 不能去掉
      var regObj;
      if (wildcard.preMatch.test(curUrl)) {
        hostname = RegExp.$1;
        regObj = { 0: hostname };
        for (var k = 1; k < 9; k++) {
          regObj[k] = RegExp['$' + (k + 1)];
        }
      }
      if (hostname != null && checkFilter()) {
        filePath = curUrl.substring(hostname.length);
        var wPath = wildcard.path;
        if (wildcard.isExact) {
          if (
            (filePath === wPath || filePath.replace(QUERY_RE, '') === wPath) &&
            --index < 0
          ) {
            if (
              (result = getExactRule(
                getRelativePath(wPath, filePath, rule.matcher),
                regObj
              ))
            ) {
              return result;
            }
          }
        } else if (filePath.indexOf(wPath) === 0) {
          var wpLen = wPath.length;
          filePath = filePath.substring(wpLen);
          if (
            (wildcard.hasQuery ||
              !filePath ||
              wPath[wpLen - 1] === '/' ||
              SEP_RE.test(filePath)) &&
            --index < 0
          ) {
            origMatcher = resolveVar(rule, vals, req);
            origMatcher = replaceSubMatcher(origMatcher, regObj);
            matcher = setProtocol(origMatcher, curUrl);
            files = getFiles(matcher);
            if (wildcard.hasQuery && filePath) {
              filePath = '?' + filePath;
            }
            if ((result = getPathRule())) {
              return result;
            }
          }
        }
      }
    } else if (rule.isExact) {
      matchedRes = pattern === url || pattern === curUrl;
      if ((not ? !matchedRes : matchedRes) && checkFilter() && --index < 0) {
        if (
          (result = getExactRule(
            getRelativePath(pattern, curUrl, rule.matcher)
          ))
        ) {
          return result;
        }
      }
    } else if (
      ((matchedUrl = curUrl.indexOf(pattern) === 0) ||
        (rule.isDomain && domainUrl.indexOf(pattern) === 0)) &&
      checkFilter()
    ) {
      var len = pattern.length;
      origMatcher = resolveVar(rule, vals, req);
      matcher = setProtocol(origMatcher, curUrl);
      files = getFiles(matcher);
      var hasQuery = pattern.indexOf('?') !== -1;
      if (
        (hasQuery ||
          (matchedUrl
            ? pattern == url || isPathSeparator(url[len])
            : pattern == _domainUrl || isPathSeparator(_domainUrl[len])) ||
          isPathSeparator(pattern[len - 1])) &&
        --index < 0
      ) {
        filePath = (matchedUrl ? curUrl : domainUrl).substring(len);
        if (hasQuery && filePath) {
          filePath = '?' + filePath;
        }
        if ((result = getPathRule())) {
          return result;
        }
      }
    }
  }

  return isIndex ? null : results;
}

function resolveProps(req, rules, vals, isIgnore) {
  var list = getRuleList(req, rules, vals);
  var result = {};
  if (isIgnore) {
    list = list.filter(function(rule) {
      var matcher = rule.matcher;
      if (SKIP_RE.test(matcher)) {
        matcher = matcher.slice(7);
        if (!matcher) {
          return false;
        }
        if (EXACT_SKIP_RE.test(matcher) || NO_PROTO_RE.test(matcher)) {
          var prop ='ignore|' + (RegExp.$1 === 'pattern' ? 'pattern' : 'matcher') + '=' + (RegExp.$2 || matcher);
          req._skipProps = req._skipProps || {};
          result[prop] = true;
          req._skipProps[prop] = true;
          return false;
        }
        matcher.split('|').forEach(function(name) {
          if (name) {
            req._skipProps = req._skipProps || {};
            req._skipProps[name] = true;
          }
        });
      } else if (EXACT_IGNORE_RE.test(matcher)) {
        result['ignore|' + (RegExp.$1 === 'pattern' ? 'pattern' : 'matcher') + '=' + RegExp.$2] = true;
        return false;
      }
      return true;
    });
    if (!list.length) {
      return result;
    }
  }
  return util.resolveProperties(list, result);
}

function parseWildcard(pattern, not) {
  if (!WILDCARD_RE.test(pattern)) {
    return;
  }
  var preMatch = RegExp.$1;
  var protocol = RegExp.$2;
  var domain = RegExp.$3;
  var startWithDot = DOT_DOMAIN_RE.test(domain);
  if (
    !startWithDot &&
    domain.indexOf('*') === -1 &&
    domain.indexOf('~') === -1
  ) {
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
    if (
      !startWithDot &&
      (domain === '*' || domain === '~') &&
      path.charAt(0) === '/'
    ) {
      preMatch += '*';
    }
    var dLen = domain.length;
    preMatch = util
      .escapeRegExp(preMatch)
      .replace(DOMAIN_STAR_RE, domainToRegExp);
    if (domain[dLen - 1] !== '*' && domain.indexOf(':') === -1) {
      preMatch += '(?::\\d+)?';
    }
    if (startWithDot) {
      preMatch = preMatch.replace('\\.', '(?:[^/?.]*\\.)?');
    }
  }
  if (!protocol) {
    preMatch = '[a-z]+://' + preMatch;
  } else if (protocol === '//') {
    preMatch = '[a-z]+:' + preMatch;
  }
  preMatch =
    '^(' + preMatch + ')' + (allowMatchPath ? util.escapeRegExp(path) : '');

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
  var rawMatcher = matcher;
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
    if (
      !isRegExp &&
      (isRegExp = util.isRegExp(pattern)) &&
      !(pattern = util.toRegExp(pattern))
    ) {
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
  var proxyName, isRules, isSpec;
  if (isHost(matcher)) {
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
    proxyName = RegExp.$1;
    protocol = 'proxy';
  } else {
    var index = matcher.indexOf('://');
    var origProto;
    if (index !== -1) {
      origProto = matcher.substring(0, index);
      protocol = aliasProtocols[origProto];
    }
    if (!protocol) {
      protocol = origProto;
      if (matcher === 'host://') {
        matcher = 'host://127.0.0.1';
      }
    } else if (protocol && (origProto === 'reqRules' || origProto === 'resRules')) {
      isRules = true;
    }
    var isStatus = protocol === 'statusCode';
    if (isStatus || protocol === 'redirect') {
      isSpec = isStatus ? 1 : 2;
    }
  }
  var rules = rulesMgr._rules;
  var list =
    protocol === 'sniCallback' ? rulesMgr._sniCallback : rules[protocol];
  var useRealPort;
  if (!list) {
    protocol = 'rule';
    list = LOCAL_RULE_RE.test(matcher) ? rules._localRule : rules.rule;
    useRealPort = RegExp.$1;
  } else if (!matcher.indexOf('G://clientCert://')) {
    list = rules._clientCerts;
  } else if (protocol == 'host') {
    var protoIndex = matcher.indexOf(':') + 3;
    var realProto = matcher.substring(0, protoIndex);
    var opts = isHost(matcher.substring(protoIndex));
    if (opts) {
      matcher = realProto + opts.host;
      port = opts.port;
    }
  }
  var rule = {
    not: not,
    isRules: isRules,
    isSpec: isSpec,
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
    isDomain:
      !isRegExp &&
      !not &&
      (noSchema ? pattern : util.removeProtocol(rawPattern, true)).indexOf(
        '/'
      ) == -1,
    rawPattern: rawPattern,
    rawMatcher: matcher === rawMatcher ? undefined : rawMatcher,
    filters: options.filters,
    lineProps: options.lineProps,
    hostFilter: options.hostFilter
  };
  if (options.rawProps.length) {
    rule.rawProps = options.rawProps;
  }
  if (protocol === 'log' || protocol === 'weinre') {
    rule.isTpl = false;
  }
  if (useRealPort) {
    rule.realPort = config.realPort;
    rule.matcher = rule.matcher.replace(
      'realPort',
      config.realPort || config.port
    );
  }
  if (proxyName) {
    switch (proxyName) {
    case 'socks':
      rule.isSocks = true;
      break;
    case 'https-proxy':
      rule.isHttps = true;
      break;
    case 'internal-http-proxy':
    case 'https2http-proxy':
    case 'internal-proxy':
      rule.isInternal = true;
      break;
    case 'internal-https-proxy':
      rule.isInternal = true;
      rule.isHttps = true;
      break;
    case 'http2https-proxy':
      rule.isHttp2https = true;
      break;
    }
  }
  if (options.hasBodyFilter) {
    rules._bodyFilters.push(rule);
  }
  if (util.isImportant(options)) {
    for (var i = 0, len = list.length; i < len; i++) {
      if (!util.isImportant(list[i])) {
        return list.splice(i, 0, rule);
      }
    }
  }
  list.push(rule);
}

function parse(rulesMgr, text, root, append) {
  if (!append) {
    protoMgr.resetRules(rulesMgr._rules);
    rulesMgr._globalPluginVars = {};
    rulesMgr._sniCallback = [];
  }
  if (Array.isArray(text)) {
    text.forEach(function (item) {
      item && parseText(rulesMgr, item.text, item.root);
    });
  } else {
    parseText(rulesMgr, text, root);
  }
}

function isPattern(item) {
  return (
    PORT_PATTERN_RE.test(item) ||
    NO_SCHEMA_RE.test(item) ||
    isExactPattern(item) ||
    isRegUrl(item, true) ||
    isNegativePattern(item) ||
    WEB_PROTOCOL_RE.test(item) ||
    util.isRegExp(item)
  );
}

var IP_WITH_PORT_RE = /^\[([:\da-f.]+)\](?::(\d+))?$/i;
var IPV4_RE = /^(?:::(?:ffff:)?)?([\d.]+)(?:\:(\d+))?$/;

function parseHost(item) {
  var port;
  if (IP_WITH_PORT_RE.test(item)) {
    item = RegExp.$1;
    port = RegExp.$2;
  }

  if (IPV4_RE.test(item)) {
    port = port || RegExp.$2;
    item = RegExp.$1;
    if (!net.isIP(item)) {
      return false;
    }
  } else if (!net.isIP(item)) {
    return false;
  }
  return {
    host: item,
    port: port
  };
}

function isHost(item) {
  var result = hostCache[item];
  if (result == null) {
    result = parseHost(item);
  }
  hostCache[item] = result;
  return result;
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
    return filter
      ? {
        not: not,
        filter: filter,
        caseIns: caseIns
      }
      : false;
  } else if (FILTER_RE.test(matcher)) {
    filter = RegExp.$1;
    if (!filter || filter === '!') {
      return false;
    }
    isInclude = matcher[0] === 'i';
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
    matcher =
      filter || matcher.substring(matcher.indexOf('://') + 3 + not.length);
    var path = util.escapeRegExp(matcher.substring(wildcard.length));
    if (path.indexOf('*') !== -1) {
      path = path.replace(STAR_RE, pathToRegExp);
    } else if (path && path[path.length - 1] !== '/') {
      path += '(?:[/?]|$)';
    }
    return {
      not: not,
      isInclude: isInclude,
      filter:
        '^[a-z]+://' + (wildcard.length > 3 ? '[^?]' : '[^/?]') + '+/' + path
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
  var lineProps = {};
  var rawProps = [];
  var filters, hasBodyFilter, hostFilter;
  list.forEach(function (matcher) {
    if (LINE_PROPS_RE.test(matcher)) {
      rawProps.push(matcher);
      extend(lineProps, util.parseLineProps(matcher));
      return;
    }
    var filter, not, isInclude, orgVal;
    if (PROPS_FILTER_RE.test(matcher) || PURE_FILTER_RE.test(matcher)) {
      var raw = RegExp['$&'];
      var propName = RegExp.$1;
      var value = RegExp.$2;
      var isHostFilter = propName === 'host';
      isInclude = matcher[1] === 'n';
      if (value[0] === '!') {
        not = !not;
        value = value.substring(1);
      }
      var pattern;
      var isIp = propName === 'i' || propName === 'ip';
      var isClientPort, isServerPort, isClientIp, isServerIp;
      if (!isIp) {
        isClientPort = propName === 'clientPort';
        if (!isClientPort) {
          isServerPort = propName === 'serverPort';
          if (!isServerPort) {
            isClientIp = propName[0] === 'c';
            isServerIp =
              !isClientIp &&
              (propName === 'serverIp' || propName === 'serverIP');
          }
        }
      }
      if (isClientPort || isServerPort) {
        pattern = util.toRegExp(value);
        if (isClientPort) {
          propName = pattern ? 'cpPattern' : 'clientPort';
        } else {
          propName = pattern ? 'spPattern' : 'serverPort';
        }
        value = pattern || value.toLowerCase();
      } else if (isIp || isClientIp || isServerIp) {
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
      } else if (propName === 'from') {
        pattern = null;
        propName = 'from';
        value = value.toLowerCase();
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
      } else if (propName === 'remoteAddress') {
        pattern = util.toRegExp(value);
        if (pattern) {
          propName = 'addrPattern';
        }
        value = pattern || value.toLowerCase();
      } else if (propName === 'remotePort') {
        pattern = util.toRegExp(value);
        if (pattern) {
          propName = 'portPattern';
        }
        value = pattern || value.toLowerCase();
      } else if (isHostFilter) {
        pattern = util.toRegExp(value);
        if (pattern) {
          propName = 'hostPattern';
        }
        value = pattern || value.toLowerCase();
      } else {
        var index = value.indexOf('=');
        var key = (
          index === -1 ? value : value.substring(0, index)
        ).toLowerCase();
        var lastIndex = key.length - 1;
        if (key[lastIndex] === '!') {
          key = key.substring(0, lastIndex);
          if (!key) {
            return;
          }
          not = !not;
        }
        orgVal = index === -1 ? '' : value.substring(index + 1);
        value = { key: key };
        if ((pattern = util.toRegExp(orgVal))) {
          value.hPattern = pattern;
        } else {
          orgVal = value.orgVal = orgVal.toLowerCase();
          value.value = util.encodeURIComponent(orgVal);
        }
        switch (propName[2]) {
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
      filter.raw = raw;
      if (isHostFilter) {
        hostFilter = hostFilter || [];
        hostFilter.push(filter);
      } else {
        filters = filters || [];
        filters.push(filter);
      }
      return;
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
    if ((filter = util.toRegExp(filter))) {
      filters = filters || [];
      filters.push({
        raw: matcher,
        pattern: filter,
        not: result.not,
        isInclude: result.isInclude
      });
    }
  });
  return {
    rawProps: rawProps,
    hasBodyFilter: hasBodyFilter,
    matchers: matchers,
    hostFilter: hostFilter,
    filters: filters,
    lineProps: lineProps
  };
}

function parseText(rulesMgr, text, root) {
  var pluginVars = rulesMgr._globalPluginVars;
  getLines(text, root).forEach(function (line) {
    var raw = line;
    line = line.replace(COMMENT_RE, '').trim();
    line = line && line.split(/\s+/);
    var len = line && line.length;
    if (len === 1 && PLUGIN_VAR_RE.test(line[0])) {
      var name = RegExp.$1;
      var value = RegExp.$3;
      if (value) {
        var vars = pluginVars[name];
        if (!vars) {
          vars = [value];
          pluginVars[name] = vars;
        } else if (vars.indexOf(value) === -1) {
          vars.push(value);
        }
      }
      return;
    }
    if (!len || len < 2) {
      return;
    }
    line = line.map(formatShorthand);
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
      var patternList = matchers.filter(function (p) {
        if (isPattern(p) || isHost(p) || !util.hasProtocol(p)) {
          return true;
        }
        opList.push(p);
      });
      opList.forEach(function (matcher) {
        patternList.forEach(function (pattern) {
          parseRule(rulesMgr, pattern, matcher, raw, root, result);
        });
      });
    } else {
      //supports: pattern operator-uri1 operator-uri2 ... operator-uriN
      matchers.forEach(function (matcher) {
        parseRule(rulesMgr, pattern, matcher, raw, root, result);
      });
    }
  });
  regUrlCache = {};
  hostCache = {};
}

function isExactPattern(pattern) {
  return /^\$/.test(pattern);
}

function isNegativePattern(pattern) {
  return /^!/.test(pattern);
}

function getFilterResult(result, filter) {
  return result == null ? false : filter.not ? !result : result;
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
  var filterProp = function (value, expectVal, pattern) {
    if (value == null) {
      return expectVal || pattern;
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
  if (filter.from) {
    if (filter.from === 'tunnel') {
      return filter.not ? !req.fromTunnel : req.fromTunnel;
    }
    if (filter.from === 'composer') {
      return filter.not ? !req.fromComposer : req.fromComposer;
    }
    if (filter.from === 'sni') {
      return filter.not ? !req.useSNI : req.useSNI;
    }
    if (filter.from === 'httpserver') {
      return filter.not ? !req.fromHttpServer : req.fromHttpServer;
    }
    if (filter.from === 'httpsserver') {
      return filter.not ? !req.fromHttpsServer : req.fromHttpsServer;
    }
    if (filter.from === 'httpsport') {
      return filter.not ? !req.isHttpsServer : req.isHttpsServer;
    }
    return false;
  }
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
  if (filterProp(req.clientPort, filter.clientPort, filter.cpPattern)) {
    return getFilterResult(result, filter);
  }
  if (filterProp(req.serverPort, filter.serverPort, filter.spPattern)) {
    return getFilterResult(result, filter);
  }

  if (filterProp(req._remoteAddr, filter.remoteAddress, filter.addrPattern)) {
    return getFilterResult(result, filter);
  }

  if (filterProp(req._remotePort, filter.remotePort, filter.portPattern)) {
    return getFilterResult(result, filter);
  }

  var reqBody = req._reqBody;
  if (filter.bodyPattern || filter.body) {
    if (typeof reqBody !== 'string') {
      return false;
    }
    if (filter.bodyPattern) {
      result = filter.bodyPattern.test(reqBody);
    } else {
      reqBody = reqBody.toLowerCase();
      result =
        reqBody.indexOf(filter.body.value) !== -1 ||
        reqBody.indexOf(filter.body.orgVal) !== -1;
    }

    return filter.not ? !result : result;
  }

  var filterHeader = function (headers, filterVal, resHeaders) {
    if (!filterVal || !headers) {
      return;
    }
    var value = headers[filterVal.key];
    if (value == null) {
      value = resHeaders && resHeaders[filterVal.key];
      if (value == null) {
        result = false;
        return true;
      }
    }
    if (!value) {
      result = !filterVal.hPattern && !filterVal.value;
      return true;
    }
    value = String(value);
    if (filterVal.hPattern) {
      result = filterVal.hPattern.test(value);
    } else {
      value = value.toLowerCase();
      result =
        value.indexOf(filterVal.value) !== -1 ||
        value.indexOf(filterVal.orgVal) !== -1;
    }
    return true;
  };
  if (filterHeader(req.headers, filter.header, req.resHeaders)) {
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
  if (!filters) {
    return;
  }
  filters.curFilter = null;
  var hasIncludeFilter;
  var include, exclude;
  for (var i = 0, len = filters.length; i < len; i++) {
    var filter = filters[i];
    hasIncludeFilter = hasIncludeFilter || filter.isInclude;
    if (
      (filter.isInclude ? !include : !exclude) &&
      matchFilter(url, filter, options)
    ) {
      if (filter.isInclude) {
        include = true;
        filters.curFilter = filter.raw;
      } else {
        exclude = true;
      }
    }
  }
  return hasIncludeFilter ? !include || exclude : exclude;
}

function Rules(values) {
  this._rules = protoMgr.getRules();
  this._globalPluginVars = {};
  this._sniCallback = [];
  this._orgValues = this._values = values || {};
}

var proto = Rules.prototype;

function resolveInlineValues(str) {
  str = str && str.replace(CONTROL_RE, '').trim();
  if (!str || str.indexOf('```') === -1) {
    return str;
  }
  return str.replace(MULTI_LINE_VALUE_RE, function (_, __, key, value) {
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
  return Array.isArray(text)
    ? text.map(resolveInlineValuesFn)
    : resolveInlineValues(text);
}

proto.parse = function (text, root, _inlineValues) {
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

proto.clearAppend = function () {
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

proto.append = function (text, root, batchUpdate) {
  var item = {
    text: text,
    root: root
  };
  if (this._rawText) {
    this._rawText.push(item);
    !this.disabled && !batchUpdate && parse(this, trimInlineValues(text), root, true);
    if (inlineValues) {
      extend(this._values, inlineValues);
      inlineValues = null;
    }
  } else {
    this._rawText = [item];
  }
};

proto.resolveHost = function (
  req,
  callback,
  pluginRulesMgr,
  rulesFileMgr,
  headerRulesMgr
) {
  if (!req.curUrl) {
    return callback();
  }
  var host = this.getHost(req, pluginRulesMgr, rulesFileMgr, headerRulesMgr);
  if (host) {
    return callback(
      null,
      util.removeProtocol(host.matcher, true),
      host.port,
      host
    );
  }
  if (!req._enableProxyHost && req.rules) {
    delete req.rules.host;
  }
  this.lookupHost(req, callback);
};

proto.lookupHost = function (req, callback) {
  req.curUrl = formatUrl(util.setProtocol(req.curUrl));
  var options = url.parse(req.curUrl);
  lookup(
    options.hostname,
    callback,
    allowDnsCache && !this.resolveDisable(req).dnsCache
  );
};

var ignoreHost = function (req, rulesMgr, filter) {
  if (!rulesMgr) {
    return false;
  }
  var ignore = rulesMgr.resolveFilter(req);
  extend(filter, ignore);
  return (
    ignore.host ||
    ignore.hosts ||
    ignore['ignore|host'] ||
    ignore['ignore|hosts']
  );
};

function getHostFromList(list, req, vals) {
  var host;
  for (var i = 0, len = list.length; i < len; i++) {
    var mgr = list[i];
    var _host = mgr && getRule(req, mgr._rules.host, vals[i] || mgr._values);
    if (_host) {
      if (util.isImportant(_host)) {
        return _host;
      }
      host = host || _host;
    }
  }
  return host;
}

proto.getHost = function (req, pluginRulesMgr, rulesFileMgr, headerRulesMgr) {
  var curUrl = formatUrl(util.setProtocol(req.curUrl));
  req.curUrl = curUrl;
  var filter = {};
  var filterHost =
    ignoreHost(req, this, filter) ||
    ignoreHost(req, pluginRulesMgr, filter) ||
    ignoreHost(req, rulesFileMgr, filter) ||
    ignoreHost(req, headerRulesMgr, filter);
  var vals = this._values;
  if (filterHost) {
    return;
  }
  var list;
  var valList;
  if (config.multiEnv) {
    list = [pluginRulesMgr, headerRulesMgr, this, rulesFileMgr];
    valList = [null, vals, vals, req._scriptValues];
  } else {
    list = [pluginRulesMgr, this, rulesFileMgr, headerRulesMgr];
    valList = [null, vals, req._scriptValues, vals];
  }
  var host = getHostFromList(list, req, valList);
  if (!host || util.exactIgnore(filter, host)) {
    return;
  }
  var matcher = util.rule.getMatcher(host);
  if (matcher && PORT_RE.test(matcher)) {
    host.matcher = RegExp.$1 + (RegExp.$2 || RegExp.$3);
    host.port = host.port || RegExp.$4;
  }
  return host;
};

proto.resolveFilter = function (req) {
  var filter = resolveProps(req, this._rules.filter, this._values);
  var ignore = resolveProps(req, this._rules.ignore, this._values, true);
  util.resolveFilter(ignore, filter);
  delete filter.filter;
  delete filter.ignore;
  delete filter['ignore|filter'];
  delete filter['ignore|ignore'];
  return filter;
};
proto.resolveDisable = function (req) {
  return resolveProps(req, this._rules.disable, this._values);
};
var pluginProtocols = [
  'enable',
  'disable',
  'plugin',
  'rule',
  'reqHeaders',
  'auth',
  'referer',
  'forwardedFor'
];
var proxyProtocols = [
  'enable',
  'disable',
  'plugin',
  'reqHeaders',
  'auth',
  'referer',
  'forwardedFor'
];

function resolveRules(req, isReq, isRes) {
  if (req.isInternalUrl) {
    return {};
  }
  var rule;
  var rules = this._rules;
  var _rules = {};
  var vals = this._values;
  var filter = this.resolveFilter(req);
  var protos;
  if (req.isPluginReq) {
    protos = req._isProxyReq ? proxyProtocols : pluginProtocols;
  } else {
    protos = isRes ? pureResProtocols : isReq ? reqProtocols : protocols;
  }
  req._inlineValues = vals;
  protos.forEach(function (name) {
    if (
      name !== 'pipe' &&
      (name === 'proxy' ||
        name === 'rule' ||
        name === 'plugin' ||
        !filter[name]) &&
      (rule = getRule(req, rules[name], vals))
    ) {
      _rules[name] = rule;
    }
  });

  multiMatchs.forEach(function (name) {
    rule = _rules[name];
    if (rule) {
      rule.list = getRuleList(req, rules[name], vals);
      util.filterRepeatPlugin(rule);
      if (name === 'rulesFile' || name === 'resScript') {
        var hasScript,
          scriptIndex = -1;
        rule.list = rule.list.filter(function (item, i) {
          if (item.isRules) {
            return true;
          }
          if (hasScript) {
            return false;
          }
          scriptIndex = i;
          hasScript = true;
          return true;
        });
        rule.scriptIndex = scriptIndex;
        rule.isRawList = true;
      }
    }
  });
  util.ignoreRules(_rules, filter);
  return _rules;
}

proto.resolveRules = function (req) {
  return resolveRules.call(this, req);
};

proto.resolveReqRules = function (req) {
  return resolveRules.call(this, req, true);
};

proto.resolveResRules = function (req) {
  return resolveRules.call(this, req, false, true);
};

proto.resolveEnable = function (req) {
  return resolveProps(req, this._rules.enable, this._values);
};

function mergeRule(rules, list, name) {
  if (list.length) {
    if (rules[name]) {
      var curList = rules[name].list;
      var flags = curList.map(function (item) {
        return item.raw;
      });
      list.forEach(function (item) {
        if (flags.indexOf(item.raw) === -1) {
          curList.push(item);
        }
      });
    } else {
      rules[name] = extend({ list: list }, list[0]);
    }
  }
}

proto.resolveProxyProps = function (req) {
  if (req.curUrl === req.fullUrl) {
    return;
  }
  var enable = getRuleList(req, this._rules.enable, this._values, true);
  var disable = getRuleList(req, this._rules.disable, this._values, true);
  if (!enable.length && !disable.length) {
    return;
  }
  mergeRule(req.rules, enable, 'enable');
  mergeRule(req.rules, disable, 'disable');
  enable = util.resolveProperties(enable);
  disable = util.resolveProperties(disable);
  if (disable.clientId || disable.clientID || disable.clientid) {
    req.disable.clientId = true;
  }
  if (enable.clientId || enable.clientID || enable.clientid) {
    req.enable.clientId = true;
  }
  if (enable.multiClient) {
    req.enable.multiClient = true;
  }
  if (enable.singleClient) {
    req.enable.singleClient = true;
  }
  if (disable.multiClient) {
    req.disable.multiClient = true;
  }
  return {
    enable: enable,
    disable: disable
  };
};

function resolveSingleRule(req, protocol, multi) {
  req.curUrl = req.curUrl || req.fullUrl;
  var filter = this.resolveFilter(req);
  if (util.isIgnored(filter, protocol)) {
    return;
  }
  var list = protocol === 'sniCallback' ? this._sniCallback : this._rules[protocol];
  if (multi) {
    list = getRuleList(req, list, this._values).filter(function(rule) {
      return !util.exactIgnore(filter, rule);
    });
    return list.length ? list : null;
  }
  var rule = getRule(req, list, this._values);
  return rule && !util.exactIgnore(filter, rule) ? rule : null;
}

proto.resolvePipe = function (req) {
  return req.isPluginReq ? null : resolveSingleRule.call(this, req, 'pipe');
};

proto.resolvePac = function (req) {
  return resolveSingleRule.call(this, req, 'pac');
};

proto.resolveRule = function (req) {
  return resolveSingleRule.call(this, req, 'rule');
};

var WHISTLE_INTERNAL_HOST =
  /^reqHeaders:\/\/whistleInternalHost=([a-z\d.-]+(?::\d{1,5})?)$/;
proto.resolveInternalHost = function (req) {
  var list = resolveSingleRule.call(this, req, 'reqHeaders', true);
  if (list) {
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (WHISTLE_INTERNAL_HOST.test(item.matcher)) {
        return RegExp.$1;
      }
    }
  }
};

proto.hasReqScript = function (req) {
  return req.isPluginReq
    ? null
    : getRule(req, this._rules.rulesFile, this._values);
};

proto.resolveProxy = function resolveProxy(req, host) {
  var proxy = getRule(req, this._rules.proxy, this._values, null, null, host);
  var matcher = proxy && proxy.matcher;
  var name = matcher && matcher.substring(0, matcher.indexOf(':'));
  var filter = this.resolveFilter(req);
  if (!proxy) {
    return proxy;
  }
  if (util.exactIgnore(filter, proxy)) {
    return;
  }
  if (filter['ignore:' + name]) {
    return proxy;
  }
  if (util.isIgnored(filter, 'proxy')) {
    return;
  }
  if (matcher[0] === 'x' && util.isIgnored(filter, 'xproxy')) {
    return;
  }
  if (matcher.indexOf(name + '://') === 0 && util.isIgnored(filter, name)) {
    return;
  }
  return proxy;
};

proto.resolveSNICallback = function (req) {
  return resolveSingleRule.call(this, req, 'sniCallback');
};

proto.resolveLocalRule = function (req) {
  return getRule(req, this._rules._localRule);
};
proto.resolveClientCert = function (req) {
  return getRule(req, this._rules._clientCerts);
};
proto.resolveBodyFilter = function (req) {
  return req.isPluginReq
    ? null
    : getRule(
        req,
        req._bodyFilters || this._rules._bodyFilters,
        null,
        null,
        true
      );
};

Rules.disableDnsCache = function () {
  allowDnsCache = false;
};

module.exports = Rules;
