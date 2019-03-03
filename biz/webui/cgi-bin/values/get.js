var values = require('../../../../lib/rules/util').values;
var properties = require('../../../../lib/rules/util').properties;

module.exports = function(req, res) {
  res.json({
    fontSize: properties.get('valuesFontSize'),
    theme: properties.get('valuesTheme'),
    showLineNumbers: properties.get('valuesShowLineNumbers'),
    values: values.list()
  });
};
