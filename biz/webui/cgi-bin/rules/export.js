var rules = require('../../lib/rules');
var util = require('../util');

module.exports = function(req, res) {
  var exportRules = req.query.rules;
  try {
    exportRules = exportRules && JSON.parse(exportRules);
  } catch(e) {
    exportRules = null;
  }
  var result = {};
  if (!exportRules || exportRules.Default) {
    var defaultRules = rules.getDefault() || '';
    result.Default = defaultRules;
  }
  rules.list().forEach(function(file) {
    if (!exportRules || exportRules[file.name]) {
      result[file.name] = file.data;
    }
  });
  res.attachment('rules_' + util.formatDate() + '.txt').send(JSON.stringify(result, null, '  '));
};
