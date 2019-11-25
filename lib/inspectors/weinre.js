var Transform = require('pipestream').Transform;
var path = require('path');
var fs = require('fs');
var util = require('../util');
var config = require('../config');

var weinreScriptFile = path.join(config.ASSESTS_PATH, 'js/weinre.js');
var weinreScript = fs.readFileSync(weinreScriptFile, {encoding: 'utf8'});
var weinreHtmlScript = '\r\n<script>' + weinreScript + '</script>\r\n';

function getScript(host, name, isHtml, isHttps) {
  var weinrePath = config.WEBUI_PATH + 'weinre.' + config.port;
  var result = weinreHtmlScript;
  if (!isHtml) {
    result = weinreScript;
    weinrePath = (isHttps ? 'https://' : 'http://') + host + weinrePath;
  }
  var weinreUrl = weinrePath + '/target/target-script-min.js#' + (name || 'anonymous');
  return result.replace('$WEINRE_PATH', weinrePath).replace('$WEINRE_URL', weinreUrl);
}

module.exports = function(req, res, next) {
  if (req.rules.weinre) {
    util.disableReqCache(req.headers);
    var host = req.headers.host;
    res.on('src', function(_res) {
      var isHtml = util.supportHtmlTransform(_res, req);
      if (!isHtml && util.getContentType(_res.headers) !== 'JS') {
        return;
      }
      util.disableCSP(_res.headers);
      !req._customCache && util.disableResStore(_res.headers);
      var name = util.getPath(util.rule.getMatcher(req.rules.weinre));
      var transform = new Transform();
      transform._transform = function(chunk, encoding, callback) {
        if (!chunk) {
          chunk = util.toBuffer(getScript(host, name, isHtml, req.isHttps));
        }
        callback(null, chunk);
      };

      res.addZipTransform(transform, false, true);
    });
  }

  next();
};
