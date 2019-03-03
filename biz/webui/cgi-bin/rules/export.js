var rules = require('../../../../lib/rules/util').rules;
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
  var filename = req.query.filename;
  if (filename && typeof filename === 'string') {
    if (!/\.(txt|json)/i.test(filename)) {
      filename += '.txt';
    }
  } else {
    filename = 'rules_' + util.formatDate() + '.txt';
  }
  res.attachment(filename).send(JSON.stringify(result, null, '  '));
};
