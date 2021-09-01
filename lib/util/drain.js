var PassThrough = require('stream').PassThrough;

var noop = function() {};

module.exports = function(stream, endHandler) {
  if (stream._hasAlreadyDrain || (!stream.noReqBody && stream.useH2)) {
    return typeof endHandler == 'function' && endHandler();
  }
  stream._hasAlreadyDrain = true;
  var emitEndStream = new PassThrough();
  emitEndStream.on('data', noop).on('error', noop);
  emitEndStream.on('end', endHandler);
  stream.pipe(emitEndStream);
};