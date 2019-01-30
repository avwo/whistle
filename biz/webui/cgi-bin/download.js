var Buffer = require('safe-buffer').Buffer;
var util = require('./util');

module.exports = function(req, res) {
  var body = req.body;
  var filename = body.filename;
  var headers = body.headers;
  var content = body.content;
  var suffix = body.type === 'log' ? '.log' : '.txt';

  if (!filename || typeof filename !== 'string') {
    filename = 'text_' + util.formatDate() + suffix;
  } else if (!/\.\w+$/.test(filename)) {
    filename += suffix;
  }

  if (body.type === 'base64') {
    try {
      content = Buffer.from(content, 'base64');
    } catch (e) {}
  }
  if (headers) {
    headers += '\r\n\r\n';
    try {
      headers = Buffer.from(headers);
      if (Buffer.isBuffer(content)) {
        content = Buffer.concat([headers, content]);
        headers = null;
      }
    } catch (e) {}
    if (headers) {
      content = headers + (content || '');
    }
  }
  res.attachment(filename).send(content);
};
