var Pac = require('node-pac');
var extend = require('util')._extend;
var Rules = require('./rules');
var util = require('../util');
var logger = require('../util/logger');
var rules = new Rules();
var tempRules = new Rules();
var cachedPacs = {};
var pacCount = 0;

exports.Rules = Rules;
exports.parse = rules.parse.bind(rules);
exports.append = rules.append.bind(rules);
exports.resolveHost = rules.resolveHost.bind(rules);
exports.resolveFilter = rules.resolveFilter.bind(rules);
exports.resolveDisable = rules.resolveDisable.bind(rules);
exports.resolveProxy = rules.resolveProxy.bind(rules);
exports.resolveRules = rules.resolveRules.bind(rules);
exports.resolveRule = rules.resolveRule.bind(rules);
exports.clearAppend = rules.clearAppend.bind(rules);

exports.disableDnsCache = function() {
  Rules.disableDnsCache();
};

function getProxy(url, req, callback) {
  var reqRules = req && req.rules;
  if (!reqRules) {
    return callback();
  }
  
  delete reqRules.proxy;
  var proxy = (req.pluginRules && req.pluginRules.resolveProxy(url)) || rules.resolveProxy(url);
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
    cachedPacs[pacUrl] = pac = new Pac(pacUrl);
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
    callback();
    logger.error(err);
  });
}

exports.getProxy = getProxy;


function getRulesFromFile(req, fileRules) {
  if (!fileRules) {
    return;
  }
  req.fileRules = fileRules;
  tempRules.parse(fileRules);
  return tempRules.resolveRules(req.fullUrl);
}

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
    extend(req.rules, getRulesFromFile(req, fileRules));
    callback();
  });
}

exports.resolveFileRules = resolveFileRules;


