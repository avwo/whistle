var fs = require('fs');
var iconv = require('iconv-lite');
var isUtf8 = require('./is-utf8');

var MAX_SIZE = 1024 * 1024 * 64;

function decode(buf) {
  if (!Buffer.isBuffer(buf)) {
    return buf ? String(buf) : '';
  }
  if (!isUtf8) {
    try {
      return iconv.decode(buf, 'GB18030');
    } catch(e) {}
  }
  return String(buf);
}

function readFile(path, callback) {
  if (!path) {
    return callback();
  }
  var stream = fs.createReadStream(path);
  var done, buf;
  var execCallback = function(err) {
    if (done) {
      return;
    }
    done = true;
    buf = err ? null : buf;
    callback(err, buf);
  };
  stream.on('data', function(data) {
    if (buf === null) {
      return;
    }
    buf = buf ? Buffer.concat([buf, data]) : data;
    if (buf.length > MAX_SIZE) {
      buf = null;
    }
  });
  stream.on('error', execCallback);
  stream.on('end', execCallback);
}

function readFiles(list, callback) {
  list = Array.isArray(list) ? list : list.split('|');
  if (!list.length) {
    return callback();
  }
  var fileMap = {};
  list.forEach(function(file) {
    if (file) {
      fileMap[file] = 1;
    }
  });
  var files = Object.keys(fileMap);
  var len = files.length;
  var result = [];
  files.forEach(function(file) {
    readFile(file, function(err, data) {
      fileMap[file] = data;
      if (--len > 0) {
        return;
      }
      list.forEach(function(file) {
        result.push(fileMap[file]);
      });
      callback(null, result);
    });
  });
}

function readFileText(path, callback) {
  readFile(path, function(err, data) {
    callback(err, decode(data));
  });
}

function readFilesText(list, callback) {
  readFiles(list, function(err, result) {
    callback(err, result && result.map(decode));
  });
}

exports.decode = decode;
exports.readFile = readFile;
exports.readFiles = readFiles;
exports.readFileText = readFileText;
exports.readFilesText = readFilesText;
