var Pac = require('node-pac');
var net = require('net');
var lookup = require('./dns');
var Rules = require('./rules');
var values = require('./util').values;
var util = require('../util');
var logger = require('../util/logger');
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
exports.clearAppend = rules.clearAppend.bind(rules);

exports.disableDnsCache = function() {
  Rules.disableDnsCache();
};

var dnsResolve = function(host, callback) {
  return lookup(host, callback || util.noop, true);
};

function getProxy(url, req, callback) {
  if (!req) {
    return callback();
  }
  var reqRules = req.rules;
  if (!reqRules) {
    return rules.lookupHost(url, callback);
  }

  delete reqRules.proxy;
  var host = rules.getHost(url, req.pluginRules, req.rulesFileMgr, req.headerRulesMgr);
  if (host) {
    reqRules.host = host;
    var hostname = util.removeProtocol(host.matcher, true);
    if (!net.isIP(hostname)) {
      return rules.lookupHost(hostname || url, function(err, ip) {
        callback(null, ip, host.port, host);
      });
    }
    return callback(null, hostname, host.port, host);
  }
  var proxy = (req.pluginRules && req.pluginRules.resolveProxy(url))
    || rules.resolveProxy(url)
    || (req.rulesFileMgr && req.rulesFileMgr.resolveProxy(url))
    || (req.headerRulesMgr && req.headerRulesMgr.resolveProxy(url));
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

function resolveFileRules(req, callback) {
  util.getRuleValue(req.rules.rulesFile, function(fileRules) {
    fileRules = fileRules && fileRules.trim();
    if (fileRules && !/^#/.test(fileRules)) {
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
        rules: []
      };
      if (util.execScriptSync(fileRules, context) && Array.isArray(context.rules)) {
        fileRules = context.rules.join('\n').trim();
      } else {
        fileRules = '';
      }
    }
    if (fileRules) {
      req.fileRules = fileRules;
      req.rulesFileMgr = new Rules();
      req.rulesFileMgr.parse(fileRules);
      fileRules = req.rulesFileMgr.resolveRules(req.fullUrl);
    }
    util.mergeRules(req, fileRules);
    callback();
  });
}

exports.resolveFileRules = resolveFileRules;

function initRules(req) {
  var headers = req.headers;
  var ruleValue = util.trimStr(headers['x-whistle-rule-value']);
  var host = util.trimStr(headers['x-whistle-rule-host']);
  if (host) {
    ruleValue = ruleValue + '\n/./ ' + host;
  }
  if (ruleValue) {
    try {
      ruleValue = decodeURIComponent(ruleValue).trim();
    } catch(e) {}
  }
  var ruleKey = util.trimStr(headers['x-whistle-rule-key']);
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
