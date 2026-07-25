var properties = require('../../../../lib/rules/util').properties;

module.exports = function(req, res) {
  res.json({multiSelect: !!properties.get('allowMultipleChoice')});
};


