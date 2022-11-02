var util = require('../../../lib/util');
var properties = require('../../../lib/rules/util').properties;


function updateName(name, value, key) {
  properties.set(name, util.isString(value) ? value.trim().toString(0, 16) : name);
  properties.set(name + 'Key', util.isString(key) ? key.trim().substring(0, 72) : '');
}

module.exports = function(req, res) {
  var name = req.body.name;
  var value = req.body.value;
  if (name === 'Custom1' || name === 'Custom2') {
    updateName(name, value, req.body.key);
  }
  res.json({ ec: 0 });
};
