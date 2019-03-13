var fs = require('fs');
var config = require('../../../../lib/config');
var rules = require('../../../../lib/rules/util').rules;

var TEMP_VALUES_DIR = config.TEMP_VALUES_DIR;
var TEMP_NAME_RE = /^\d{1,30}$/;
var MAX_LENGTH = 1024 * 1024 * 5;

function writeTempValue(data, callback) {
  if (!TEMP_NAME_RE.test(data.key) || !data.value || typeof data.value !== 'string') {
    return callback();
  }
  var filepath = TEMP_VALUES_DIR + '/' + data.key;
  fs.writeFile(filepath, data.value.substring(0, MAX_LENGTH), callback);
}

module.exports = function(req, res) {
  var body = req.body;
  writeTempValue(body, function(err) {
    if (err) {
      return res.json({ec: 0, em: err.message});
    }
    rules.add(body.name, body.value, body.clientId);
    rules.select(req.body.name);
    res.json({ec: 0, em: 'success', defaultRulesIsDisabled: rules.defaultRulesIsDisabled(), list: rules.getSelectedList()});
  });
};
