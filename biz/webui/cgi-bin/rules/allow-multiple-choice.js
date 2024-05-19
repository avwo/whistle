var properties = require('../../../../lib/rules/util').properties;
var proxy = require('../../lib/proxy');

module.exports = function(req, res) {
  var enable = req.body.allowMultipleChoice == 1;
  properties.set('allowMultipleChoice', enable);
  proxy.emit('rulesDataChange', 'allowMultipleChoice', enable);
  res.json({ec: 0, em: 'success'});
};


