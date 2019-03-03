var values = require('../../../../lib/rules/util').values;

module.exports = function(req, res) {
  var body = req.body;
  values.rename(body.name, body.newName, body.clientId);
  res.json({ec: 0, em: 'success'});
};
