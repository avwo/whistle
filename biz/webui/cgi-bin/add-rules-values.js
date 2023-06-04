var rules = require('../../../lib/rules/util').rules;
var values = require('../../../lib/rules/util').values;

module.exports = function(req, res) {
  var body = req.body;
  var clientId = body.clientId;
  var rulesData = body.rules;
  var valuesData = body.values;
  if (rulesData) {
    if (rulesData.name === 'Default') {
      rules.setDefault(rulesData.value, clientId);
    } else {
      rules.add(rulesData.name, rulesData.value, clientId);
    }
    rules.select(rulesData.name);
  }
  if (valuesData) {
    values.add(valuesData.name, valuesData.value, clientId);
  }
  res.json({ec: 0, em: 'success'});
};
