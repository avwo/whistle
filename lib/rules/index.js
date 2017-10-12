var Pac = require('node-pac');
var net = require('net');
var lookup = require('./dns');
var Rules = require('./rules');
var values = require('./util').values;
var util = require('../util');
var logger = require('../util/logger');
var config = require('../config');

var rules = new Rules();
var tempRules = new Rules();
var cachedPacs = {};
var pacCount = 0;
var resolveRules = rules.resolveRules.bind(rules);

exports.Rules = Rules;
exports.parse = rules.parse.bind(rules);
exports.append = rules.append.bind(rules);
exports.resolveHost = rules.resolveHost.bind(rules);
exports.resolveDisable = rules.resolveDisable.bind(rules);
exports.resolveProxy = rules.resolveProxy.bind(rules);
exports.resolveRules = resolveRules;
exports.resolveRule = rules.resolveRule.bind(rules);
exports.resolveLocalRule = rules.resolveLocalRule.bind(rules);
exports.clearAppend = rules.clearAppend.bind(rules);

exports.disableDnsCache = function() {
  Rules.disableDnsCache();
};

var dnsResolve = function(host, callback) {
  return lookup(host, callback || util.noop, true);
};
var PROXY_HOSTS_RE = /\?proxyHosts?$/i;
function getProxy(url, req, callback) {
  if (!req) {
    return callback();
  }
  var reqRules = req.rules;
  if (util.isLocalIp(req.clientIp)) {
    delete req.headers[config.CLIENT_IP_HEAD];
  } else {
    req.headers[config.CLIENT_IP_HEAD] = req.clientIp;
  }
  if (!reqRules) {
    return rules.lookupHost(url, callback);
  }

  delete reqRules.proxy;
  var pRules = req.pluginRules;
  var fRules = req.rulesFileMgr;
  var hRules = req.headerRulesMgr;
  var proxy = (pRules && pRules.resolveProxy(url))
    || rules.resolveProxy(url)
    || (fRules && fRules.resolveProxy(url))
    || (hRules && hRules.resolveProxy(url));
  var proxyHosts;
  if (proxy) {
    var protocol = proxy.matcher.substring(0, proxy.matcher.indexOf(':'));
    var filterProxy = (pRules && pRules.resolveFilter(url)[protocol])
      || rules.resolveFilter(url)[protocol]
      || (req.fileRules && req.fileRules.resolveFilter(url)[protocol])
      || (hRules && hRules.resolveFilter(url)[protocol]);
    if (filterProxy) {
      proxy = null;
    } else if (proxy.matcher.indexOf('proxy://') === 0) {
      proxyHosts = PROXY_HOSTS_RE.test(proxy.matcher);
    }
  }
  var host = rules.getHost(url, pRules, fRules, hRules);
  if (host) {
    if (proxyHosts) {
      var matcher = host.matcher;
      if (host.port) {
        matcher = matcher + ':' + host.port;
      }
      req.headers['x-whistle-rule-host'] = util.encodeURIComponent(host.rawPattern + ' ' + matcher);
    } else {
      reqRules.host = host;
      var hostname = util.removeProtocol(host.matcher, true);
      if (!net.isIP(hostname)) {
        return rules.lookupHost(hostname || url, function(err, ip) {
          callback(null, ip, host.port, host);
        });
      }
      return callback(null, hostname, host.port, host);
    }
  }
  if (proxy) {
    reqRules.proxy = proxy;
    return callback();
  }

  var pacRule = reqRules && reqRules.pac;
  var pacUrl = util.getMatcherValue(pacRule);
  if (!pacUrl) {
    return callback();
  }

  var pac = cachedPacs[pacUrl];
  if (pac) {
    delete cachedPacs[pacUrl];
    cachedPacs[pacUrl] = pac;
  } else {
    pacCount++;
    var list = Object.keys(cachedPacs);
    if (list.length >= 10) {
      pacCount--;
      delete cachedPacs[list[0]];
    }
    pacUrl = /^https?\:\/\//.test(pacUrl) ? pacUrl : util.join(pacRule.root, pacUrl);
    cachedPacs[pacUrl] = pac = new Pac(pacUrl, dnsResolve);
  }
  return pac.findWhistleProxyForURL(url.replace('tunnel:', 'https:'), function(err, rule) {
    if (rule) {
      tempRules.parse(pacRule.rawPattern + ' ' + rule);
      rule = tempRules.resolveRules(url);
      if (rule && rule.proxy) {
        reqRules.proxy = rule.proxy;
        reqRules.proxy.raw = pacRule.raw;
      }
    }
    if (reqRules.proxy) {
      callback();
    } else {
      rules.lookupHost(url, callback);
    }
    logger.error(err);
  });
}

exports.getProxy = getProxy;

function resolveRulesFile(req, callback) {
  util.getRuleValue(req.rules.rulesFile, function(fileRules) {
    fileRules = fileRules && fileRules.trim();
    var execCallback = function() {
      if (fileRules) {
        req.fileRules = fileRules;
        req.rulesFileMgr = new Rules();
        req.rulesFileMgr.parse(fileRules);
        fileRules = req.rulesFileMgr.resolveRules(req.fullUrl);
      }
      util.mergeRules(req, fileRules);
      callback();
    };
    if (fileRules && !/^#/.test(fileRules)) {
      var getReqPayload = function(cb) {
        if (req.getPayload && util.hasRequestBody(req)) {
          req.getPayload(function(err, payload) {
            util.getBody(payload, req.headers, cb);
          });
        } else {
          cb('');
        }
      };
      getReqPayload(function(body) {
        var ip = req.clientIp;
        var context = {
          url: req.fullUrl,
          method: util.toUpperCase(req.method) || 'GET',
          httpVersion: req.httpVersion || '1.1',
          isLocalAddress: function(_ip) {
            return util.isLocalAddress(_ip || ip);
          },
          ip: ip,
          headers: util.clone(req.headers),
          body: body,
          rules: []
        };
        if (util.execScriptSync(fileRules, context) && Array.isArray(context.rules)) {
          fileRules = context.rules.join('\n').trim();
        } else {
          fileRules = '';
        }
        execCallback();
      });
      return;
    }
    execCallback();
  });
}

exports.resolveRulesFile = resolveRulesFile;

function initRules(req) {
  var headers = req.headers;
  var ruleValue = util.trimStr(headers['x-whistle-rule-value']);
  var host = util.trimStr(headers['x-whistle-rule-host']);
  if (host) {
    ruleValue = ruleValue + '\n' + host;
  }
  if (ruleValue) {
    try {
      ruleValue = decodeURIComponent(ruleValue).trim();
    } catch(e) {}
  }
  var ruleKey = util.trimStr(headers['x-whistle-rule-key']);
  try {
    ruleKey = decodeURIComponent(ruleKey);
  } catch(e) {}
  if (ruleKey) {
    ruleKey = util.trimStr(values.get(ruleKey));
    if (ruleKey) {
      ruleValue = ruleKey + '\n' + ruleValue;
    }
  }
  var fullUrl = req.fullUrl || util.getFullUrl(req);
  var rulesFromHeader;
  var rulesMgr;
  if (ruleValue) {
    rulesMgr = new Rules();
    rulesMgr.parse(ruleValue);
    rulesFromHeader = rulesMgr.resolveRules(fullUrl);
    if (!Object.keys(rulesFromHeader).length) {
      rulesFromHeader = null;
    }
  }
  delete headers['x-whistle-rule-value'];
  delete headers['x-whistle-rule-host'];
  delete headers['x-whistle-rule-key'];
  if (rulesFromHeader) {
    req.headerRulesMgr = rulesMgr;
    req.rules = rulesFromHeader;
    util.mergeRules(req, resolveRules(fullUrl));
  } else {
    req.rules = resolveRules(fullUrl);
  }
  return req.rules;
}

exports.initRules = initRules;
