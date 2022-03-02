var express = require('express');
var path = require('path');
var fs = require('fs');
var app = express();
var util = require('./util');
var ssi1 = fs.readFileSync(path.join(__dirname, '../assets/files/ssi1.html'), {encoding: 'utf8'});
var ssi2 = fs.readFileSync(path.join(__dirname, '../assets/files/ssi2.html'), {encoding: 'utf8'});
var ssi3 = fs.readFileSync(path.join(__dirname, '../assets/files/ssi3.html'), {encoding: 'utf8'});

module.exports = function(server, options) {
  util.init(options);
  server.on('request', app);
  app.use(function(req, res, next) {
    req.on('error', next);
    res.on('error', next);
    var fullUrl = util.getFullUrl(req);
    var rules = [];

    if (/host/.test(fullUrl)) {
      rules.push(req.hostname + ' filter://rule');
    }

    if (/reqspeed/.test(fullUrl)) {
      rules.push(req.hostname + ' reqSpeed://1');
    }

    if (/resspeed/.test(fullUrl)) {
      res.end(req.hostname + ' resSpeed://1');
    }

    if (/xfile/.test(fullUrl)) {
      rules.push(req.hostname + ' xfile://assets/files');
    }

    if (/file/.test(fullUrl)) {
      rules.push(req.hostname + ' file://assets/files');
    }

    if (/xtpl/.test(fullUrl)) {
      rules.push(req.hostname + ' xtpl://assets/files');
    }

    if (/xraw/.test(fullUrl)) {
      rules.push(req.hostname + ' xrawfile://assets/files');
    }

    if (/referer/.test(fullUrl)) {
      rules.push('/referer/ referer://xxx');
    }

    if (/reqtype/.test(fullUrl)) {
      rules.push('/reqtype/ reqType://text');
    }

    if (/restype/.test(fullUrl)) {
      rules.push('/restype/ resType://html');
    }

    if (/reqcookies/.test(fullUrl)) {
      rules.push('/reqcookies/ reqCookies://assets/values/reqCookies.json');
    }

    if (/rescookies/.test(fullUrl)) {
      rules.push('/rescookies/ resCookies://assets/values/resCookies.json');
    }

    if (/reqprepend/.test(fullUrl)) {
      rules.push('/reqprepend/ reqPrepend://assets/files/prepend.txt');
    }

    if (/resprepend/.test(fullUrl)) {
      rules.push('/resprepend/ resPrepend://assets/files/prepend.txt');
    }

    if (/urlparams/.test(fullUrl)) {
      rules.push('/urlparams/ urlParams://assets/values/urlParams.json');
    }

    if (/params/.test(fullUrl)) {
      rules.push('/params/ params://assets/values/urlParams.json');
    }

    if (/reqwriteraw/.test(fullUrl)) {
      rules.push(req.hostname + ' reqWriteRaw://assets/write/req/raw');
    }

    if (/reqwrite/.test(fullUrl)) {
      rules.push(req.hostname + ' reqWrite://assets/write/req/body');
    }

    if (/exportsurl/.test(fullUrl)) {
      rules.push(req.hostname + ' exportsUrl://assets/write/exportsUrl.txt');
    }

    if (/exports/.test(fullUrl)) {
      rules.push(req.hostname + ' exports://assets/write/exports.txt');
    }

    if (/ws1/.test(fullUrl)) {
      rules.push('/ws1/ host://127.0.0.1:9999');
    }

    if (/mp1.w2.org/.test(fullUrl)) {
      rules.push('/./ host://127.0.0.1:8080');
    }

    if (/values1.avenwu.com/.test(fullUrl)) {
      return res.end(JSON.stringify({
        rules: '/./ file://{test} reqHeaders://{reqHeaders} resHeaders://{resHeaders}',
        values: {
          test: {
            abc: 123
          },
          reqHeaders: {
            'x-req-test': 'req'
          },
          resHeaders: {
            'x-res-test': 'res'
          }
        }
      }));
    }

    if (/values2.test.com/.test(fullUrl)) {
      return res.end(JSON.stringify({
        rules: '/./  reqHeaders://{reqHeaders} resHeaders://{resHeaders} reqReplace://{reqReplace}',
        values: {
          test: {
            abc: 123
          },
          reqHeaders: {
            'x-req-test': 'req'
          },
          resHeaders: {
            'x-res-test': 'res'
          },
          reqReplace: {
            ssi1: ssi1,
            ssi2: ssi2,
            '/ssi3/': ssi3
          }
        }
      }));
    }

    if (/ssi-include.whistlejs.com/.test(fullUrl)) {
      return res.end(JSON.stringify({
        rules: '/./  resReplace://{resReplace}',
        values: {
          resReplace: {
            '#include(\'assets/files/ssi2.html\')': ssi2,
            '#include(\'assets/files/ssi3.html\')': ssi3,
            '/#include\\((([\'\"])?([^\\s]+)\\2)\\)/': ssi1
          }
        }
      }));
    }

    var nextRule = util.getNextRule(req);
    if (nextRule) {
      rules.push(nextRule);
    }

    res.end(rules.join('\n'));
  });

  app.use(function(err, req, res, next) {
    res.sendStatus(500);
  });
};