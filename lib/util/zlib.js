var zlib = require('zlib');

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

module.exports = {
  inflate: createConvenienceMethod(zlib.Inflate, false),
  gunzip: createConvenienceMethod(zlib.Gunzip, false),
  inflateRaw: createConvenienceMethod(zlib.InflateRaw, false)
};
