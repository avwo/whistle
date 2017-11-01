var crypto = require('crypto');

function maskFrame(source, mask, output, offset, length) {
  for (var i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask[i & 3];
  }
}

// function unmask(buffer, mask) {
//   var length = buffer.length;
//   for (var i = 0; i < length; i++) {
//     buffer[i] ^= mask[i & 3];
//   }
// }

function frame(data, options) {
  var offset = options.mask ? 6 : 2;
  var payloadLength = data.length;

  if (data.length >= 65536) {
    offset += 8;
    payloadLength = 127;
  } else if (data.length > 125) {
    offset += 2;
    payloadLength = 126;
  }

  var target = new Buffer(data.length + offset);
  target[0] = options.fin ? options.opcode | 0x80 : options.opcode;
  if (options.rsv1) target[0] |= 0x40;

  if (payloadLength === 126) {
    target.writeUInt16BE(data.length, 2, true);
  } else if (payloadLength === 127) {
    target.writeUInt32BE(0, 2, true);
    target.writeUInt32BE(data.length, 6, true);
  }

  if (!options.mask) {
    target[1] = payloadLength;
    data.copy(target, offset);
    return target;
  }

  var mask = crypto.randomBytes(4);
  target[1] = payloadLength | 0x80;
  target[offset - 4] = mask[0];
  target[offset - 3] = mask[1];
  target[offset - 2] = mask[2];
  target[offset - 1] = mask[3];
  maskFrame(data, mask, target, offset, data.length);

  return target;
}

exports.encode = function(data, options) {
  if (!Buffer.isBuffer(data)) {
    data = new Buffer(data + '');
  }
  options = options || {};
  return frame(data, options);
};
