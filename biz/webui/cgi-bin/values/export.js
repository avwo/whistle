var values = require('../../../../lib/rules/util').values;
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
  var filename = req.query.filename;
  if (filename && typeof filename === 'string') {
    if (!/\.(txt|json)/i.test(filename)) {
      filename += '.txt';
    }
  } else {
    filename = 'values_' + util.formatDate() + '.txt';
  }
  res.attachment(filename).send(JSON.stringify(result, null, '  '));
};
