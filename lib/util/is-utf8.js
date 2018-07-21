var MAX_LEN = 1024 * 32;

module.exports = function(buf) {
  for (var i = 0, len = Math.min(buf.length, MAX_LEN); i < len; i++) {
    var byte = buf[i];
    if (byte == 0x09 || byte == 0x0A || byte == 0x0D ||
      (0x20 <= byte && byte <= 0x7E)) {
      continue;
    }
    ++i;
    var byte1 = buf[i];
    if(0xC2 <= byte && byte <= 0xDF) {
      if (0x80 <= byte1 && byte1 <= 0xBF) {
        continue;
      }
      return !byte1;
    }
    ++i;
    var byte2 = buf[i];
    if (byte == 0xE0) {
      if ((0xA0 <= byte1 && byte1 <= 0xBF) && (0x80 <= byte2 && byte2 <= 0xBF)) {
        continue;
      }
      return !byte2;
    }

    if ((0xE1 <= byte && byte <= 0xEC) || byte == 0xEE || byte == 0xEF) {
      if ((0x80 <= byte1 && byte1 <= 0xBF) && (0x80 <= byte2 && byte2 <= 0xBF)) {
        continue;
      }
      return !byte2;
    }
    
    if (byte == 0xED) {
      if ((0x80 <= byte1 && byte1 <= 0x9F) && (0x80 <= byte2 && byte2 <= 0xBF)) {
        continue;
      }
      return !byte2;
    }
    ++i;
    var byte3 = buf[i];
    if (byte == 0xF0) {
      if ((0x90 <= byte1 && byte1 <= 0xBF) &&
       (0x80 <= byte2 && byte2 <= 0xBF) &&
       (0x80 <= byte3 && byte3 <= 0xBF)) {
        continue;
      }
      return !byte3;
    }
    if (0xF1 <= byte && byte <= 0xF3) {
      if ((0x80 <= byte1 && byte1 <= 0xBF) &&
      (0x80 <= byte2 && byte2 <= 0xBF) &&
      (0x80 <= byte3 && byte3 <= 0xBF)) {
        continue;
      }
      return !byte3;
    }
    if (byte == 0xF4) {
      if ((0x80 <= byte1 && byte1 <= 0x8F) &&
      (0x80 <= byte2 && byte2 <= 0xBF) &&
      (0x80 <= byte3 && byte3 <= 0xBF)) {
        continue;
      }
      return !byte3;
    }

    return false;
  }
  return true;
};
