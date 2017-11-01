
function mask(source, mask, output, offset, length) {
  for (var i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask[i & 3];
  }
}

function unmask(buffer, mask) {
  // Required until https://github.com/nodejs/node/issues/9006 is resolved.
  var length = buffer.length;
  for (var i = 0; i < length; i++) {
    buffer[i] ^= mask[i & 3];
  }
}

exports.encode = function(buf) {
  if (!buf) {
    return;
  }
  if (!(buf instanceof Buffer)) {
    buf += '';
  }
  var mask = crypto.randomBytes(4);
};
