var properties = require('../../../lib/rules/util').properties;
var config = require('../../../lib/config');
var common = require('../../../lib/util/common');

module.exports = function(req, res) {
  var version = config.version;
  var doNotShowAgainVersion = properties.get('doNotShowAgainVersion');
  var latestVersion = properties.getLatestVersion('latestVersion');
  var hasNewVersion = common.compareVersion(latestVersion, version);

  res.json({
    ec: 0,
    em: 'success',
    showUpdate: !config.disableUpdateTips && hasNewVersion > 1 && common.compareVersion(latestVersion, doNotShowAgainVersion) > 1,
    hasNewVersion: hasNewVersion > 0,
    version: config.version,
    latestVersion: latestVersion
  });
};

