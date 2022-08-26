var express = require('express');
var app = express();
var util = require('./util');

module.exports = function(server, options) {
  util.init(options);
  server.on('request', app);
  app.use(function(req, res, next) {
    req.on('error', next);
    res.on('error', next);
    var rules = [];
    var host = req.headers.host;
    if (/^(\d+)\.tnl[56]\.whistlejs\.com/.test(host)) {
      rules.push('/./ host://127.0.0.1:' + RegExp.$1);
    } else if (host == 'tnl2.whistlejs.com') {
      rules.push('tunnel://tnl2.whistlejs.com host://127.0.0.1:8080');
    } else if (host == 'tnl3.whistlejs.com') {
      rules.push('tnl3.whistlejs.com host://127.0.0.1:8080');
    } else if (host == 'break.whistlejs.com') {
      rules.push('tunnel://break.whistlejs.com disable://tunnel');
    }

    if ('ts.whistlejs.com' != req.headers.host) {
      rules.push('/./ filter://rule');
    }
    res.end(rules.join('\n'));
  });

  app.use(function(err, req, res, next) {
    res.sendStatus(500);
  });
};