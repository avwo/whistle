var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  properties.set('doNotShowAgainVersion', properties.get('latestVersion'));
  res.json({ec: 0, em: 'success'});
};


