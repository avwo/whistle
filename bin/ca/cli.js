var installRootCA = require('./index');
var util = require('../util');

function getCAFilePath(url) {

}

module.exports = function(argv) {
  installRootCA(getCAFilePath());
};
