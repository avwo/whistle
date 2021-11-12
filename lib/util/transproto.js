var Buffer = require('safe-buffer').Buffer;
var Transform = require('stream').Transform;
var bufUtil = require('./buf-util');

var OPTIONS = { highWaterMark: 0 };
var LF = Buffer.from('\n');

function getBuffer(data) {
  return !data || Buffer.isBuffer(data) ? data : Buffer.from(String(data));
}

function pack(data) {
  if (!data) {
    return Buffer.from('\n0\n');
  }
  return Buffer.concat([Buffer.from('\n' + data.length + '\n'), data]);
}

exports.pack = function(data) {
  return pack(getBuffer(data));
};

exports.getEncodeTransform = function() {
  var trans = new Transform(OPTIONS);
  trans._transform = function(chunk, _, cb) {
    cb(null, pack(chunk));
  };
  trans.push_ = trans.push;
  trans.push = function(chunk, encoding) {
    if (chunk) {
      return trans.push_(chunk, encoding);
    }
  };
  trans.end_ = trans.end;
  trans.end = function(chunk, encoding, callback) {
    chunk && trans.write(chunk, encoding, callback);
    return trans.end_(function() {
      trans.push_(pack());
    });
  };
  return trans;
};

function Parser() {
  var buf;
  var len = 0;
  var parseChunk = function() {
    if (len <= 0) {
      var index = bufUtil.indexOf(buf, LF, 1);
      if (index === -1) {
        return;
      }
      len = parseInt(String(buf.slice(1, index)), 10);
      if (!len) {
        return false;
      }
      buf = buf.slice(index + 1);
      if (!buf.length) {
        return;
      }
    }
    var curLen = len;
    var chunk = buf.slice(0, curLen);
    len -= chunk.length;
    buf = buf.length > curLen ? buf.slice(curLen) : null;
    return chunk;
  };
  var self = this;
  self.write = function(chunk) {
    if (chunk) {
      buf = buf ? Buffer.concat([buf, chunk]) : chunk;
    } else if (!buf) {
      return;
    }
    var data = parseChunk();
    if (data === false) {
      return self.onEnd && self.onEnd();
    }
    if (!data) {
      if (chunk === false) {
        return;
      }
      return self.onContinue && self.onContinue();
    }
    self.onData && self.onData(data);
    self.write(false);
  };
}

exports.getDecodeTransform = function() {
  var trans = new Transform(OPTIONS);
  var parser = new Parser();
  var transCb, data;
  parser.onEnd = function() {
    data && trans.push(data);
    trans.push(null);
  };
  parser.onContinue = function() {
    if (transCb) {
      transCb();
      transCb = null;
    }
  };
  parser.onData = function(chunk) {
    data = data ? Buffer.concat([data, chunk]) : chunk;
    if (transCb) {
      transCb(null, data);
      transCb = data = null;
    }
  };
  trans._transform = function(chunk, _, cb) {
    transCb = cb;
    parser.write(chunk);
  };
  return trans;
};

