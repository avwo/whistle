var fork = require('pfork').fork;
var path = require('path');
var util = require('../../lib/util');
var config = require('../../lib/config');

var options = {
  script: path.join(__dirname, 'server.js'),
  debugMode: config.debugMode
};

module.exports = function(req, res) {
  fork(options,
    function(err, options) {
      if (err) {
        util.sendRes(res, 500, err.stack || err);
      } else {
        util.transformReq(req, res, options.port);
      }
    }
  );
};
