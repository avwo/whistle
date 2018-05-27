var Transform = require('pipestream').Transform;
var path = require('path');
var fs = require('fs');
var util = require('../util');
var config = require('../config');
var existsCustomCert = require('../https/util').existsCustomCert;

var weinreScriptFile = path.join(config.ASSESTS_PATH, 'js/weinre.js');
var weinreScript = fs.readFileSync(weinreScriptFile, {encoding: 'utf8'});
var weinreHtmlScript = '\r\n<script>' + weinreScript + '</script>\r\n';

function getScript(req, name, isHtml) {
  var host = req.headers.host;
  if (!existsCustomCert(host)) {
    host = config.localUIHost;
  }
  host = (req.isHttps ? 'https://' : 'http://') + host;
  var weinrePath = host + config.WEBUI_PATH + 'weinre.' + config.weinreport;
  var weinreUrl = weinrePath + '/target/target-script-min.js#' + (name || 'anonymous');
  var result = isHtml ? weinreHtmlScript : weinreScript;
  return result.replace('$WEINRE_PATH', weinrePath).replace('$WEINRE_URL', weinreUrl);
}

module.exports = function(req, res, next) {
  if (req.rules.weinre) {
    util.disableReqCache(req.headers);
    res.on('src', function(_res) {
      var isHtml = util.supportHtmlTransform(_res);
      if (!isHtml && util.getContentType(_res.headers) !== 'JS') {
        return;
      }
      util.disableCSP(_res.headers);
      util.disableResStore(_res.headers);
      var name = util.getPath(util.rule.getMatcher(req.rules.weinre));
      var transform = new Transform();
      transform._transform = function(chunk, encoding, callback) {
        if (!chunk) {
          chunk = util.toBuffer(getScript(req, name, isHtml));
        }
        callback(null, chunk);
      };

      res.addZipTransform(transform, false, true);
    });
  }

  next();
};
