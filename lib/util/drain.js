var PassThrough = require('stream').PassThrough;

var noop = function() {};

module.exports = function(stream, endHandler) {
  var emitEndStream = new PassThrough();
  emitEndStream.on('data', noop).on('error', noop);
  typeof endHandler == 'function' && emitEndStream.on('end', endHandler);
  stream.pipe(emitEndStream);
};