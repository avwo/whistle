var common = require('./common');

var createTransform = common.createTransform;
var noop = common.noop;

module.exports = function (stream, endHandler) {
  if (stream._hasAlreadyDrain || (!stream.noReqBody && stream.useH2)) {
    return endHandler && endHandler();
  }
  stream._hasAlreadyDrain = true;
  // 需要跟 pipeStream 配合使用，确保流的结束事件能够被正确触发，不能直接用 common.onReadEnd
  var emitEndStream = createTransform();
  emitEndStream.on('data', noop).on('error', noop);
  if (endHandler) {
    // 204 + pipe 可能不触发 end 事件，需要手动调用 endHandler
    if (stream.readableEnded) {
      endHandler();
    } else {
      emitEndStream.on('end', endHandler);
    }
  }
  stream.pipe(emitEndStream);
};
