var Transform = require('pipestream').Transform;
var util = require('../util');
var weinreUrl;

module.exports = function(req, res, next) {
  if (req.rules.weinre) {
    if (!weinreUrl) {
      weinreUrl = this.config.weinreport + '.weinre.'
        + this.config.localUIHost + '/target/target-script-min.js#';
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
          chunk = util.toBuffer('\r\n<script src="' + (req.isHttps ? 'https:' : 'http:')
            + '//' + weinreUrl + (name || 'anonymous') + '"></script>\r\n');
        }
        callback(null, chunk);
      };

      res.addZipTransform(transform, false, true);
    });
  }

  next();
};
