var common = require('./common');

var noop = common.noop;
var onReadEnd = common.onReadEnd;

module.exports = function (stream, endHandler) {
  if (stream._hasAlreadyDrain || (!stream.noReqBody && stream.useH2)) {
    return typeof endHandler == 'function' && endHandler();
  }
  stream._hasAlreadyDrain = true;
  onReadEnd(stream, endHandler);
  stream.on('data', noop).on('error', noop);
};
