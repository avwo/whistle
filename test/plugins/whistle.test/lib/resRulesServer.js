var express = require('express');
var app = express();
var util = require('./util');

module.exports = function(server, options) {
  util.init(options);
  server.on('request', app);
  app.use(function(req, res, next) {
    req.on('error', next);
    res.on('error', next);

    var fullUrl = util.getFullUrl(req);
    var rules = [];

    if (/js\d/.test(fullUrl)) {
      rules.push(req.hostname + ' js://assets/files/js.js');
    }

    if (/html\d/.test(fullUrl)) {
      rules.push('/html/ html://assets/files/html.html');
    }

    if (/css\d/.test(fullUrl)) {
      rules.push(req.hostname + ' css://assets/files/css.css');
    }

    if (/js1/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://html');
    }

    if (/js2/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://js');
    }

    if (/css1/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://html');
    }

    if (/css2/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://css');
    }

    if (/css3/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://js');
    }

    if (/html1/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://html');
    }

    if (/html2/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://css');
    }

    if (/html3/.test(fullUrl)) {
      rules.push(req.hostname + ' resType://js');
    }

    if (/log1/.test(fullUrl)) {
      rules.push('/log1/ resType://html');
    }

    if (/log2/.test(fullUrl)) {
      rules.push('/log2/ resType://js');
    }

    if (/reswrite2/.test(fullUrl)) {
      rules.push(req.hostname + ' resWriteRaw://assets/write/res/raw');
    }

    if (/reswrite/.test(fullUrl)) {
      rules.push(req.hostname + ' resWrite://assets/write/res/body');
    }

    if (/disable/.test(fullUrl)) {
      rules.push(req.hostname + ' disable://cache|cookie cache://60000 resCookies://assets/values/resCookies.json');
    }

    if (/attachment/.test(fullUrl)) {
      rules.push('/attachment/ attachment://');
    }

    if (/res\./.test(fullUrl)) {
      rules.push('/res\./ res://assets/values/res.json');
    }

    if (/values2.test.com/.test(fullUrl)) {
      rules.push(JSON.stringify({
        rules: '/./ resHeaders://{resHeaders}',
        values: {
          resHeaders: {
            'x-res-test2': 'res'
          }
        }
      }));
    }

    res.end(rules.join('\n'));
  });

  app.use(function(err, req, res, next) {
    res.sendStatus(500);
  });
};