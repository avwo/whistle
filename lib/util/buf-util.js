exports.indexOf = function (buf, subBuf, start) {
  start = start || 0;
  var subLen = subBuf.length;
  if (!subLen) {
    return -1;
  }
  var len = buf.length - subLen;
  if (len < start) {
    return -1;
  }
  if (buf.indexOf) {
    return buf.indexOf(subBuf, start);
  }

  for (var i = start; i <= len; i++) {
    var j = 0;
    for (; j < subLen; j++) {
      if (subBuf[j] !== buf[i + j]) {
        break;
      }
    }
    if (j == subLen) {
      return i;
    }
  }

  return -1;
};
