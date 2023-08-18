var fork = require('pfork').fork;
var path = require('path');
var config = require('../config');

function loadService(callback) {
  fork(
    {
      script: path.join(__dirname, 'service.js'),
      debugMode: config.debugMode,
      TEMP_FILES_PATH: config.TEMP_FILES_PATH
    },
    callback
  );
}

module.exports = loadService;
