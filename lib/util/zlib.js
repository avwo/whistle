var zlib = require('zlib');
var Limiter = require('async-limiter');

var limiter = new Limiter({ concurrency: 10 });

function createConvenienceMethod(ctor, sync) {
  return function (buffer, opts, callback) {
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
  engine.once('end', zlibBufferOnEnd);
  engine.end(buffer);
}

function zlibBufferOnData(chunk) {
  if (!this.buffers) this.buffers = [chunk];
  else this.buffers.push(chunk);
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
  buf = bufs.length === 1 ? bufs[0] : Buffer.concat(bufs, this.nread);
  this.close();
  if (err) this.cb(err);
  else if (this._info) this.cb(null, { buffer: buf, engine: this });
  else this.cb(null, buf);
}

var noop = function(body, callback) {
  return callback(null, body);
};

var inflate = createConvenienceMethod(zlib.Inflate, false);
var gunzip = createConvenienceMethod(zlib.Gunzip, false);
var inflateRaw = createConvenienceMethod(zlib.InflateRaw, false);
var brotliDecompress = zlib.BrotliDecompress ? createConvenienceMethod(zlib.BrotliDecompress, false) : noop;
var zstdDecompress = zlib.ZstdDecompress ? createConvenienceMethod(zlib.ZstdDecompress, false) : noop;

function unzip(encoding, body, callback) {
  if (body && typeof encoding === 'string') {
    encoding = encoding.trim().toLowerCase();
    if (encoding === 'gzip') {
      if (body[0] !== 31 || body[1] !== 139) {
        callback(null, body);
        return true;
      }
      limiter.push(function (done) {
        gunzip(body, function (err, data) {
          done();
          callback(err, data);
        });
      });
      return;
    }
    if (encoding === 'br') {
      limiter.push(function (done) {
        brotliDecompress(body, function (err, data) {
          done();
          callback(err, data);
        });
      });
      return;
    }
    if (encoding === 'zstd') {
      limiter.push(function (done) {
        zstdDecompress(body, function (err, data) {
          done();
          callback(err, data);
        });
      });
      return;
    }
    if (encoding === 'deflate') {
      limiter.push(function (done) {
        inflate(body, function (err, data) {
          if (!err) {
            done();
            return callback(null, data);
          }
          inflateRaw(body, function (e2, data2) {
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

var GZIP_MAGIC_0 = 0x1f;
var GZIP_MAGIC_1 = 0x8b;
var ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd];

/**
 * 根据魔数自动识别压缩格式（用于没有 content-encoding 头的场景）
 * 注意：brotli 没有魔数，只能靠尝试解压来识别
 */
function detectEncoding(buffer) {
  if (!buffer || !buffer.length) {
    return null;
  }
  if (buffer.length >= 2 && buffer[0] === GZIP_MAGIC_0 && buffer[1] === GZIP_MAGIC_1) {
    return 'gzip';
  }
  if (buffer.length >= 4 && ZSTD_MAGIC.every(function(magic, index) {
    return buffer[index] === magic;
  })) {
    return 'zstd';
  }
  if (buffer.length >= 2) {
    var cmf = buffer[0];
    var flg = buffer[1];
    // zlib 头: CM(4bit)=8 且 (CMF<<8 + FLG) % 31 === 0
    if ((cmf & 0x0f) === 8 && ((cmf << 8) + flg) % 31 === 0) {
      return 'deflate';
    }
  }
  return null;
}

function isValidUtf8(buffer) {
  if (!buffer || !buffer.length) {
    return false;
  }
  return buffer.toString('utf8').indexOf('\ufffd') === -1;
}

var MAX_AUTO_BROTLI_SIZE = 512 * 1024;

/**
 * 自动解压：优先按魔数识别 gzip/deflate/zstd，
 * 识别不到时对二进制数据尝试 brotli 解压（brotli 无魔数），
 * 解压失败时保留原始内容
 */
function unzipAuto(body, callback, options) {
  options = options || {};
  if (!body || !body.length) {
    return callback(null, body);
  }
  var encoding = detectEncoding(body);
  if (encoding) {
    return unzip(encoding, body, function (err, data) {
      // 解压失败时保留原始内容，避免误报错误
      callback(null, err ? body : (data || body));
    });
  }
  // 纯文本内容不做尝试，避免无谓的开销
  if (!options.tryBrotli || body.length < 16 || body.length > MAX_AUTO_BROTLI_SIZE ||
    isValidUtf8(body)) {
    return callback(null, body);
  }
  limiter.push(function (done) {
    brotliDecompress(body, function (err, data) {
      done();
      if (err || !data || !data.length) {
        return callback(null, body);
      }
      callback(null, data);
    });
  });
}

module.exports = {
  unzip: unzip,
  unzipAuto: unzipAuto,
  detectEncoding: detectEncoding,
  inflate: inflate,
  gunzip: gunzip,
  inflateRaw: inflateRaw,
  brotliDecompress: brotliDecompress,
  zstdDecompress: zstdDecompress
};
