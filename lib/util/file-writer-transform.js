var Transform = require('pipestream').Transform;
var util = require('util');
var config = require('../config');
var STATUS_CODES = require('http').STATUS_CODES || {};

function FileWriterTransform(writer, source, isRaw, req, isReq) {
  var self = this;
  Transform.call(self);
  self._writer = writer;
  source.on('error', function() {
    writer.end();
  });
  isRaw && writer.write(getRawData(source, req, isReq));
}

function getRawData(source, req, isReq) {
  var firstLine;
  if (req) {
    var message = source.statusMessage || STATUS_CODES[source.statusCode] || '';
    firstLine = ['HTTP/' + (req.httpVersion || '1.1'), source.statusCode, message].join(' ');
  } else {
    firstLine = [source.method, source.url, 'HTTP/' + (source.httpVersion || '1.1')].join(' ');
  }

  var headers = [];
  var rawHeaderNames = source.rawHeaderNames || {};
  Object.keys(source.headers).forEach(function(key) {
    var val = source.headers[key];
    if (!isReq || (key !== config.HTTPS_FIELD && key !== 'content-encoding')) {
      key = rawHeaderNames[key] || key;
      headers.push(Array.isArray(val) ? val.map(function(item) {
        return key + ': ' + item;
      }).join('\r\n') : key + ': ' + val);
    }
  });

  return firstLine + '\r\n' + headers.join('\r\n') + '\r\n\r\n';
}

util.inherits(FileWriterTransform, Transform);

FileWriterTransform.prototype._transform = function(chunk, encoding, callback) {
  if (chunk) {
    this._writer.write(chunk);
  } else {
    this._writer.end();
  }

  callback(null, chunk);
};

module.exports = FileWriterTransform;
