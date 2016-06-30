var Rules = require('./rules');
var rules = new Rules();

exports.Rules = Rules;
exports.parse = rules.parse.bind(rules);
exports.append = rules.append.bind(rules);
exports.resolveHost = rules.resolveHost.bind(rules);
exports.resolveFilter = rules.resolveFilter.bind(rules);
exports.resolveDisable = rules.resolveDisable.bind(rules);
exports.resolveRules = rules.resolveRules.bind(rules);
exports.resolveRule = rules.resolveRule.bind(rules);
exports.resolveLocalHost = rules.resolveLocalHost.bind(rules);
exports.clearAppend = rules.clearAppend.bind(rules);

exports.disableDnsCache = function() {
	Rules.disableDnsCache();
};
