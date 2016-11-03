var Pac = require('node-pac');
var Rules = require('./rules');
var util = require('../util');
var rules = new Rules();
var pacRules = new Rules();
var cachedPacs = {};
var pacCount = 0;

exports.Rules = Rules;
exports.parse = rules.parse.bind(rules);
exports.append = rules.append.bind(rules);
exports.resolveHost = rules.resolveHost.bind(rules);
exports.resolveFilter = rules.resolveFilter.bind(rules);
exports.resolveDisable = rules.resolveDisable.bind(rules);
exports.resolveRules = rules.resolveRules.bind(rules);
exports.resolveRule = rules.resolveRule.bind(rules);
exports.clearAppend = rules.clearAppend.bind(rules);

exports.disableDnsCache = function() {
  Rules.disableDnsCache();
};

function findProxyFromPac(url, reqRules, callback) {
  var pacRule = reqRules && reqRules.pac;
  var pacUrl = util.getMatcherValue(pacRule);
  if (!pacUrl || reqRules.proxy) {
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
      pacRules.parse(pacRule.rawPattern + ' ' + rule);
      rule = pacRules.resolveRules(url);
      if (rule && rule.proxy) {
        reqRules.proxy = rule.proxy;
        reqRules.proxy.raw = pacRule.raw;
      }
    }
    callback();
  });
}

exports.findProxyFromPac = findProxyFromPac;

