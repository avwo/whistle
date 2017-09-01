var rules = require('../../lib/rules');

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
    if (rules.defaultRulesIsDisabled()) {
      result.Default = defaultRules;
    } else {
      result.Default = {
        rules: defaultRules,
        enable: true
      };
    }
  }
  rules.list().forEach(function(file) {
    if (!exportRules || exportRules[file.name]) {
      if (file.selected) {
        result[file.name] = {
          rules: file.data,
          enable: true
        };
      } else {
        result[file.name] = file.data;
      }
    }
  });
  res.attachment('rules_' + Date.now() + '.txt').send(JSON.stringify(result, null, '  '));
};
