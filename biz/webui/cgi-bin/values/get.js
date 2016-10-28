var values = require('../../lib/values');
var properties = require('../../lib/properties');

module.exports = function(req, res) {
  res.json({
    fontSize: properties.get('valuesFontSize'),
    theme: properties.get('valuesTheme'),
    showLineNumbers: properties.get('valuesShowLineNumbers'),
    values: values.list()
  });
};
