var properties = require('../../../lib/rules/util').properties;

module.exports = function(req, res) {
  properties.set('doNotShowAgainVersion', properties.getLatestVersion('latestVersion'));
  res.json({ec: 0, em: 'success'});
};


