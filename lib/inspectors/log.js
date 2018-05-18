var fs = require('fs');
var path = require('path');
var Transform = require('pipestream').Transform;
var util = require('../util');
var config = require('../config');
var logScriptFile = path.join(config.ASSESTS_PATH, 'js/log.js');
var logScript = fs.readFileSync(logScriptFile, {encoding: 'utf8'});
var logHtmlScript;
var LOG_ID_RE = /^log:\/\/([^/\\{}()<>\s]{1,36})$/;

function wrapScript(script, isHtml) {
  return isHtml ? '\r\n<script>' + script + '</script>\r\n' : '\r\n' + script + '\r\n';
}

module.exports = function(req, res, next) {
  var log = req.rules.log;
  if (log) {
    if (!logHtmlScript) {
      var logCgi = this.config.WEBUI_PATH + 'log.' + config.uiport + '/cgi-bin/log/set';
      logScript = logScript.replace('$LOG_CGI', logCgi);
      logHtmlScript = '<!DOCTYPE html>\r\n<script>' + logScript + '</script>\r\n';
    }
    util.disableReqCache(req.headers);
    res.on('src', function(_res) {
      var topScript, isHtml;
      if (util.supportHtmlTransform(_res)) {
        isHtml = true;
        topScript = logHtmlScript;
      } else if (util.getContentType(_res.headers) == 'JS') {
        topScript = logScript;
      }

      if (topScript) {
        util.disableCSP(_res.headers);
        if (!isHtml && !_res.headers['access-control-allow-origin']) {
          _res.headers['access-control-allow-origin'] = '*';
        }

        var userScript;
        var transform = new Transform();
        var added;
        transform._transform = function(chunk, encoding, callback) {
          if (!added) {
            added = true;
            var logId = '';
            if (LOG_ID_RE.test(log.matcher)) {
              logId = RegExp.$1;
              try {
                logId = encodeURIComponent(logId);
              } catch (e) {}
            }
            util.getRuleValue(logId ? null : log, function(script) {
              topScript = topScript.replace('$LOG_ID', logId);
              var buf = [util.toBuffer(topScript)];
              userScript = script || null;
              if (userScript) {
                userScript = util.toBuffer(wrapScript(userScript, isHtml));
                if (isHtml || !chunk) {
                  buf.push(userScript);
                  userScript = null;
                }
              }
              chunk && buf.push(chunk);
              callback(null, Buffer.concat(buf));
            });
          } else {
            callback(null, chunk || userScript);
          }
        };

        res.addZipTransform(transform, false, true);
      }
    });
  }

  next();
};
