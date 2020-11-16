var zlib = require('zlib');
var Limiter = require('async-limiter');

var limiter = new Limiter({ concurrency: 10 });

function createConvenienceMethod(ctor, sync) {
  return function(buffer, opts, callback) {
    if (typeof opts === 'function') {
      callback = opts;
      opts = {};
    }
    return zlibBuffer(new ctor(opts), buffer, callback);
  };
}

function zlibBuffer(engine, buffer, callback) {
  engine.buffers = [];
  engine.nread = 0;
  engine.cb = callback;
  engine.on('data', zlibBufferOnData);
  engine.on('error', zlibBufferOnError);
  engine.on('end', zlibBufferOnEnd);
  engine.end(buffer);
}

function zlibBufferOnData(chunk) {
  if (!this.buffers)
    this.buffers = [chunk];
  else
    this.buffers.push(chunk);
  this.nread += chunk.length;
}

function zlibBufferOnError(err) {
  this.removeAllListeners('end');
  this.cb(err);
}

function zlibBufferOnEnd() {
  var buf;
  var err;
  var bufs = this.buffers;
  buf = (bufs.length === 1 ? bufs[0] : Buffer.concat(bufs, this.nread));
  this.close();
  if (err)
    this.cb(err);
  else if (this._info)
    this.cb(null, { buffer: buf, engine: this });
  else
    this.cb(null, buf);
}

var inflate = createConvenienceMethod(zlib.Inflate, false);
var gunzip = createConvenienceMethod(zlib.Gunzip, false);
var inflateRaw = createConvenienceMethod(zlib.InflateRaw, false);

function unzip(encoding, body, callback) {
  if (body && typeof encoding === 'string') {
    encoding = encoding.trim().toLowerCase();
    if (encoding === 'gzip') {
      if (body[0] !== 31 || body[1] !== 139) {
        callback(null, body);
        return true;
      }
      limiter.push(function(done) {
        gunzip(body, function(err, data) {
          done();
          callback(err, data);
        });
      });
      return;
    }
    if (encoding === 'deflate') {
      limiter.push(function(done) {
        inflate(body, function(err, data) {
          if (!err) {
            done();
            return callback(null, data);
          }
          inflateRaw(body, function(e2, data2) {
            done();
            callback(e2, data2);
          });
        });
      });
      return;
    }
  }
  callback(null, body);
}

module.exports = {
  unzip: unzip,
  inflate: inflate,
  gunzip: gunzip,
  inflateRaw: inflateRaw
};
