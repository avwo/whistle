
function writeUInt16BE(value, offset) {
  this[offset] = (value & 0xff00)>>8;
  this[offset+1] = value & 0xff;
}

function writeUInt32BE(value, offset) {
  this[offset] = (value & 0xff000000)>>24;
  this[offset+1] = (value & 0xff0000)>>16;
  this[offset+2] = (value & 0xff00)>>8;
  this[offset+3] = value & 0xff;
}

module.exports = function encodeFrame(data) {
  var dataLength = data.length;
  var dataOffset = 2;
  var secondByte = dataLength;

  if (dataLength >= 65536) {
    dataOffset += 8;
    secondByte = 127;
  } else if (dataLength > 125) {
    dataOffset += 2;
    secondByte = 126;
  }

  var mergeBuffers = dataLength < 32768;
  var totalLength = mergeBuffers ? dataLength + dataOffset : dataOffset;
  var outputBuffer = new Buffer(totalLength);
  outputBuffer[0] = 1 | 0x80;

  switch (secondByte) {
  case 126:
    writeUInt16BE.call(outputBuffer, dataLength, 2);
    break;
  case 127:
    writeUInt32BE.call(outputBuffer, 0, 2);
    writeUInt32BE.call(outputBuffer, dataLength, 6);
  }

  outputBuffer[1] = secondByte;
  mergeBuffers && data.copy(outputBuffer, dataOffset);
  return outputBuffer;
};
