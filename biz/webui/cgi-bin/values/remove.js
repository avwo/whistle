var values = require('../../../../lib/rules/util').values;

module.exports = function(req, res) {
  values.remove(req.body.name, req.body.clientId);
  res.json({ec: 0, em: 'success'});
};
