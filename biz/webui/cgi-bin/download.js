var Buffer = require('safe-buffer').Buffer;
var util = require('./util');

module.exports = function(req, res) {
  var body = req.body;
  var filename = body.filename;
  var headers = body.headers;
  var content = body.content;
  var type = body.type;
  var suffix = '.txt';
  if (type === 'log') {
    suffix = '.log';
  } else if (type === 'rawBase64') {
    type = 'base64';
    suffix = '';
  }

  if (!filename || typeof filename !== 'string') {
    filename = 'text_' + util.formatDate() + suffix;
  } else if (!/\.\w+$/.test(filename)) {
    filename += suffix;
  }

  if (type === 'base64') {
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
