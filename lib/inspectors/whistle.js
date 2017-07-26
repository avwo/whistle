var fs = require('fs');
var path = require('path');
var Transform = require('pipestream').Transform;
var util = require('../util');
var config = require('../config');

var INJECT_HTML_PATH = path.join(config.ASSESTS_PATH, 'user.html');
var INJECT_HTML = fs.readFileSync(INJECT_HTML_PATH, {encoding: 'utf8'});

var injectBuffer;


module.exports = function(req, res, next) {
  if (req.rules.user) {
    res.on('src', function(_res) {
      if (!util.supportHtmlTransform(_res)) {
        return;
      }
      if (!injectBuffer) {
        injectBuffer = INJECT_HTML.replace('{injectScriptSrc}', config.USER_PATH_PREFIX + 'js/inject.js');
        injectBuffer = new Buffer(injectBuffer);
      }
      util.disableCSP(_res.headers);
      _res.headers['cache-control'] = 'no-store';
      _res.headers.expires = new Date(Date.now() - 60000000).toGMTString();
      _res.headers.pragma = 'no-cache';
      var transform = new Transform();
      transform._transform = function(chunk, encoding, callback) {
        callback(null, chunk || injectBuffer);
      };
      res.addZipTransform(transform, false, true);
    });
  }

  next();
};
