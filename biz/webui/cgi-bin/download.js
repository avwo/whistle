var Buffer = require('safe-buffer').Buffer;
var util = require('./util');

module.exports = function(req, res) {
  var body = req.body;
  var filename = body.filename;
  var isLog = body.type === 'log';
  var isBase64 = body.type === 'base64';
  var suffix = isLog ? '.log' : '.txt';
  if (!filename || typeof filename !== 'string') {
    filename = 'text_' + util.formatDate() + suffix;
  } else if (!/\.\w+$/.test(filename)) {
    filename += suffix;
  }
  var content = body.content;
  if (isBase64) {
    try {
      content = Buffer.from(content, 'base64');
    } catch (e) {}
  }
  res.attachment(filename).send(content);
};
