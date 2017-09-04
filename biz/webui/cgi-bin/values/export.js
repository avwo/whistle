var values = require('../../lib/values');
var util = require('../util');

module.exports = function(req, res) {
  var exportValues = req.query.values;
  try {
    exportValues = exportValues && JSON.parse(exportValues);
  } catch(e) {
    exportValues = null;
  }
  var result = {};
  values.list().forEach(function(file) {
    if (!exportValues || exportValues[file.name]) {
      result[file.name] = file.data;
    }
  });
  res.attachment('values_' + util.formatDate() + '.txt').send(JSON.stringify(result, null, '  '));
};
