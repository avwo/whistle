var fs = require('fs');
var path = require('path');
var Transform = require('pipestream').Transform;
var util = require('../util');
var config = require('../config');
var logScriptFile = path.join(config.ASSESTS_PATH, 'js/log.js');
var logScript = fs.readFileSync(logScriptFile, { encoding: 'utf8' });
var logHtmlScript = '<!DOCTYPE html>\r\n<script>' + logScript + '</script>\r\n';
var LOG_ID_RE = /^log:\/\/(\{[^\s]{1,36}\}|[^/\\{}()<>\s]{1,36})$/;

function wrapScript(script, isHtml) {
  return isHtml
    ? '\r\n<script>' + script + '</script>\r\n'
    : '\r\n' + script + '\r\n';
}

function getScript(host, isHtml, req) {
  host = util.getInternalHost(req, host);
  var logCgiPath =
    config.WEBUI_PATH + 'log.' + config.port + '/cgi-bin/log/set';
  var result = isHtml ? logHtmlScript : logScript;
  logCgiPath = (req.isHttps ? 'https://' : 'http://') + host + logCgiPath;
  return result.replace('$LOG_CGI', logCgiPath);
}

module.exports = function (req, res, next) {
  var log = req.rules.log;
  if (log) {
    util.disableReqCache(req.headers);
    var host = req.headers.host;
    res.on('src', function (_res) {
      var topScript, isHtml;
      if (util.supportHtmlTransform(_res, req)) {
        isHtml = true;
        topScript = getScript(host, isHtml, req);
      } else if (util.getContentType(_res.headers) == 'JS') {
        topScript = getScript(host, isHtml, req);
      }

      if (topScript) {
        var enable = req.enable;
        topScript = topScript.replace(
          /\$INTERCEPT_CONSOLE/g,
          !req.disable.interceptConsole || !!enable.interceptConsole
        );
        !enable.keepAllCSP && util.disableCSP(_res.headers);
        !req._customCache && util.disableResStore(_res.headers);
        var userScript;
        var transform = new Transform();
        var added;
        transform._transform = function (chunk, encoding, callback) {
          if (!added) {
            added = true;
            var logId = '';
            var isValue;
            if (LOG_ID_RE.test(log.matcher)) {
              logId = RegExp.$1;
              if (logId[0] === '{') {
                logId = logId.slice(1, -1);
                isValue = true;
              }
              try {
                logId = encodeURIComponent(logId);
              } catch (e) {}
            }
            util.getRuleValue(
              logId && !isValue ? null : log,
              function (script) {
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
              },
              null,
              null,
              null,
              req
            );
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
