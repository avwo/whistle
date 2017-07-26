var fs = require('fs');
var path = require('path');
var Transform = require('pipestream').Transform;
var util = require('../util');
var config = require('../config');

var SCRIPT_SRC = '/whistle/_/user/_/scripts/_/inject.js';
var INJECT_HTML_PATH = path.join(config.ASSESTS_PATH, 'user.html');
var INJECT_HTML = fs.readFileSync(INJECT_HTML_PATH, {encoding: 'utf8'});

INJECT_HTML = new Buffer(INJECT_HTML.replace('{injectScriptSrc}', SCRIPT_SRC));


module.exports = function(req, res, next) {
  if (req.rules.user) {
    res.on('src', function(_res) {
      if (!util.supportHtmlTransform(_res)) {
        return;
      }
      util.disableCSP(_res.headers);
      _res.headers['cache-control'] = 'no-store';
      _res.headers.expires = new Date(Date.now() - 60000000).toGMTString();
      _res.headers.pragma = 'no-cache';
      var transform = new Transform();
      transform._transform = function(chunk, encoding, callback) {
        callback(null, chunk || INJECT_HTML);
      };
      res.addZipTransform(transform, false, true);
    });
  }

  next();
};
