var Buffer = require('safe-buffer').Buffer;
var Transform = require('stream').Transform;
var bufUtil = require('./buf-util');

var OPTIONS = { highWaterMark: 0 };
var LF = Buffer.from('\n');

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
  var buf;
  var len = 0;
  trans._transform = function(chunk, _, cb) {
    buf = buf ? Buffer.concat([buf, chunk]) : chunk;
    if (len <= 0) {
      var index = bufUtil.indexOf(buf, LF, 1);
      if (index === -1) {
        return cb();
      }
      len = parseInt(String(buf.slice(1, index)), 10);
      if (!len) {
        return trans.emit('end');
      }
      buf = buf.slice(index + 1);
      if (!buf.length) {
        return cb();
      }
    }
    chunk = buf.slice(0, len);
    len = len - buf.length;
    buf = buf.slice(len);
    cb(null, chunk);
  };
  return trans;
};

