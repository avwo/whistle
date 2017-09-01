var values = require('../../lib/values');

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
  res.attachment('values_' + Date.now() + '.txt').send(JSON.stringify(result, null, '  '));
};
