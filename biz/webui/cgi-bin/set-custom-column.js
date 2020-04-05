var properties = require('../../../lib/rules/util').properties;

function updateName(name, value) {
  if (!value || typeof value !== 'string') {
    value = name;
  } else {
    value = value.trim().toString(0, 16);
  }
  properties.set(name, value);
}

module.exports = function(req, res) {
  var name = req.body.name;
  var value = req.body.value;
  if (name === 'Custom1' || name === 'Custom2') {
    updateName(name, value);
  }
  res.json({ ec: 0 });
};
