var fork = require('pfork').fork;
var path = require('path');
var colors = require('colors');
var config = require('../config');

function loadService(callback) {
  fork({
    script: path.join(__dirname, 'service.js'),
    debugMode: config.debugMode
  }, callback);
}

module.exports = loadService;
