var createTransform = require('./common').createTransform;

var noop = function () {};

module.exports = function (stream, endHandler) {
  if (stream._hasAlreadyDrain || (!stream.noReqBody && stream.useH2)) {
    return typeof endHandler == 'function' && endHandler();
  }
  stream._hasAlreadyDrain = true;
  var emitEndStream = createTransform();
  emitEndStream.on('data', noop).on('error', noop);
  emitEndStream.on('end', endHandler);
  stream.pipe(emitEndStream);
};
