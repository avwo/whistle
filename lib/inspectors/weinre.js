var Transform = require('pipestream').Transform;
var util = require('../util');
var weinrePath, weinreUrl, weinreScript;

module.exports = function(req, res, next) {
  if (req.rules.weinre) {
    if (!weinreUrl) {
      weinrePath = this.config.WEBUI_PATH + 'weinre.' + this.config.weinreport;
      weinreUrl = weinrePath + '/target/target-script-min.js#';
      weinreScript = '\r\n<script>window.WeinreServerURL="' + weinrePath + '"</script>\r\n';
    }
    util.disableReqCache(req.headers);
    res.on('src', function(_res) {
      if (!util.supportHtmlTransform(_res)) {
        return;
      }
      util.disableCSP(_res.headers);
      var name = util.getPath(util.rule.getMatcher(req.rules.weinre));
      var transform = new Transform();
      transform._transform = function(chunk, encoding, callback) {
        if (!chunk) {
          chunk = util.toBuffer(weinreScript + '<script src="' + weinreUrl + (name || 'anonymous') + '"></script>\r\n');
        }
        callback(null, chunk);
      };

      res.addZipTransform(transform, false, true);
    });
  }

  next();
};
