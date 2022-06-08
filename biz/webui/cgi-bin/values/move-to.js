var values = require('../../../../lib/rules/util').values;

module.exports = function(req, res) {
  var body = req.body;
  var result = values.moveTo(body.from, body.to, body.clientId, body.group === 'true');
  res.json({ec: result ? 0 : 2, em: 'success'});
};
