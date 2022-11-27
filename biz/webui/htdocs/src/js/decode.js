var toByteArray = require('base64-js').toByteArray;
var base64Decode = require('js-base64').Base64.decode;
var isUtf8 = require('./is-utf8');

var gbkDecoder;
if (self.TextDecoder) {
  try {
    gbkDecoder = new self.TextDecoder('GB18030');
  } catch (e) {}
}

function base64toBytes(base64) {
  try {
    return toByteArray(base64);
  } catch (e) {}
}

self.getText = function(base64) {
  var arr = base64 && base64toBytes(base64);
  if (!arr) {
    return '';
  }
  if (!isUtf8(arr)) {
    try {
      if (gbkDecoder) {
        return gbkDecoder.decode(arr);
      }
    } catch (e) {}
  }
  try {
    return base64Decode(base64);
  } catch (e) {}
  return '';
};
