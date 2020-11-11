var properties = require('../../../lib/rules/util').properties;
var config = require('../../../lib/config');

function compare(v1, v2) {
  if (typeof v1 != 'string') {
    return false;
  }
  if (typeof v2 != 'string') {
    return true;
  }
  v1 = v1.split('.');
  v2 = v2.split('.');
  var v1Major = parseInt(v1[0], 10) || 0;
  var v2Major = parseInt(v2[0], 10) || 0;

  if (v1Major < v2Major) {
    return false;
  }

  if (v1Major > v2Major) {
    return true;
  }

  return parseInt(v1[1], 10) > parseInt(v2[1], 10);
}

module.exports = function(req, res) {
  var version = config.version;
  var doNotShowAgainVersion = properties.get('doNotShowAgainVersion');
  var latestVersion = properties.getLatestVersion('latestVersion');

  res.json({
    ec: 0,
    em: 'success',
    showUpdate: !config.disableUpdateTips && compare(latestVersion, version) && compare(latestVersion, doNotShowAgainVersion),
    version: config.version,
    latestVersion: latestVersion
  });
};

