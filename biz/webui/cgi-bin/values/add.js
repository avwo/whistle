var values = require('../../lib/values');

module.exports = function(req, res) {
  var body = req.body;
  values.add(body.name, body.value, body.clientId);
  res.json({ec: 0, em: 'success'});
};
