var Pac = require('node-pac');
var Rules = require('./rules');
var util = require('../util');
var rules = new Rules();
var pacRules = new Rules();
var cachedPacs = {};
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

function findProxyFromPac(req, next) {
  var rules = req.rules;
  var pacUrl = util.getMatcherValue(rules.pac);
  if (rules.rule || rules.host || !pacUrl) {
    return next();
  }
  if (!pacUrl) {
    return next();
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
    cachedPacs[pacUrl] = pac = new Pac(/^https?\:\/\//.test(pacUrl) ? pacUrl : util.join(rules.pac.root, pacUrl));
  }
  return pac.findWhistleProxyForURL(req.fullUrl.replace('tunnel:', 'https:'), function(err, rule) {
    if (rule) {
    	pacRules.parse(rules.pac.rawPattern + ' ' + rule);
		rules.rule = pacRules.resolveRules(req.fullUrl).rule;
    }
    next();
  });
}

exports.findProxyFromPac = findProxyFromPac;
