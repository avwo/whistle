var properties = require('../../lib/properties');

module.exports = function(req, res) {
  properties.set('allowMultipleChoice', req.body.allowMultipleChoice == 1);
  res.json({ec: 0, em: 'success'});
};


