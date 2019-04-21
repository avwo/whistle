var Buffer = require('safe-buffer').Buffer;
var assert = require('assert');
var parser = require('../../lib/socket-mgr/parser');

function repeat(str, n) {
  return str.repeat ? str.repeat(n) : new Array(n + 1).join(str);
}

function testParser() {
  var data = [];

  for (var i = 0; i < 6; i++) {
    data[i] = parser.encode(repeat(i + '', 20 * (i + 1)));
  }

  data = Buffer.concat(data);

  var decoder = new parser.Decoder();
  var limtDecoder = new parser.Decoder(10);

  decoder.onData = function(data) {
    assert(data.length >= 20);
    data = data.toString();
    assert(data === repeat(data[0], 20 * (+data[0] + 1)));
  };
  decoder.write(data);
  decoder.write(data);

  limtDecoder.onData = function(data) {
    assert(data.length === 10);
    data = data.toString();
    assert(data === repeat(data[0], 10));
  };

  limtDecoder.write(data);
  limtDecoder.write(data);
}

module.exports = function() {
  testParser();
};
