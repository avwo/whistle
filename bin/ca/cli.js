var path = require('path');
var installRootCA = require('./index');
var getWhistlePath = require('../../lib/util/common').getWhistlePath;

function getDefaultCA() {
  return path.join(getWhistlePath(), '.whistle/certs/root.crt');
}

module.exports = function(argv) {
  installRootCA(getDefaultCA());
};
