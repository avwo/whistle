var Buffer = require('safe-buffer').Buffer;
var Transform = require('stream').Transform;

var OPTIONS = { highWaterMark: 0 };

function getBuffer(data) {
  return Buffer.isBuffer(data) ? data : Buffer.from(String(data));
}

function pack(data) {
  if (!data) {
    return Buffer.from('\n0\n');
  }
  data = getBuffer(data);
  return Buffer.concat([Buffer.from('\n' + data.length + '\n'), data]);
}

exports.pack = pack;

exports.getEncodeTransform = function() {
  var trans = new Transform(OPTIONS);
  trans._transform = function(chunk, _, cb) {
    cb(null, pack(chunk));
  };
  trans.end = function() {
    trans.push(pack());
  };
  return trans;
};

exports.getDecodeTransform = function() {
  var trans = new Transform(OPTIONS);
  trans._transform = function(chunk, _, cb) {
    cb(null, pack(chunk));
  };
  return trans;
};

