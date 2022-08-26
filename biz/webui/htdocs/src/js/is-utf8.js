var MAX_LEN = 1024 * 32;

function isUtf8(buf, i) {
  i = i || 0;
  for (var len = Math.min(buf.length, MAX_LEN); i < len; i++) {
    var byte = buf[i];
    if (
      byte == 0x09 ||
      byte == 0x0a ||
      byte == 0x0d ||
      (0x20 <= byte && byte <= 0x7f)
    ) {
      continue;
    }
    ++i;
    var byte1 = buf[i];
    if (0xc2 <= byte && byte <= 0xdf) {
      if (0x80 <= byte1 && byte1 <= 0xbf) {
        continue;
      }
      return !byte1;
    }
    ++i;
    var byte2 = buf[i];
    if (byte == 0xe0) {
      if (0xa0 <= byte1 && byte1 <= 0xbf && 0x80 <= byte2 && byte2 <= 0xbf) {
        continue;
      }
      return !byte2;
    }

    if ((0xe1 <= byte && byte <= 0xec) || byte == 0xee || byte == 0xef) {
      if (0x80 <= byte1 && byte1 <= 0xbf && 0x80 <= byte2 && byte2 <= 0xbf) {
        continue;
      }
      return !byte2;
    }

    if (byte == 0xed) {
      if (0x80 <= byte1 && byte1 <= 0x9f && 0x80 <= byte2 && byte2 <= 0xbf) {
        continue;
      }
      return !byte2;
    }
    ++i;
    var byte3 = buf[i];
    if (byte == 0xf0) {
      if (
        0x90 <= byte1 &&
        byte1 <= 0xbf &&
        0x80 <= byte2 &&
        byte2 <= 0xbf &&
        0x80 <= byte3 &&
        byte3 <= 0xbf
      ) {
        continue;
      }
      return !byte3;
    }
    if (0xf1 <= byte && byte <= 0xf3) {
      if (
        0x80 <= byte1 &&
        byte1 <= 0xbf &&
        0x80 <= byte2 &&
        byte2 <= 0xbf &&
        0x80 <= byte3 &&
        byte3 <= 0xbf
      ) {
        continue;
      }
      return !byte3;
    }
    if (byte == 0xf4) {
      if (
        0x80 <= byte1 &&
        byte1 <= 0x8f &&
        0x80 <= byte2 &&
        byte2 <= 0xbf &&
        0x80 <= byte3 &&
        byte3 <= 0xbf
      ) {
        continue;
      }
      return !byte3;
    }

    return false;
  }
  return true;
}

module.exports = function (buf) {
  if (isUtf8(buf)) {
    return true;
  }
  return buf[0] === 0 && isUtf8(buf, 5);
};
