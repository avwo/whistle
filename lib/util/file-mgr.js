var fs = require('fs');
var iconv = require('iconv-lite');
var Buffer = require('safe-buffer').Buffer;
var isUtf8 = require('./is-utf8');

var MAX_SIZE = 1024 * 1024 * 64;
var CRLF = Buffer.from('\r\n');
var noop = function(_) {
  return _;
};

function decode(buf) {
  if (!Buffer.isBuffer(buf)) {
    return buf ? String(buf) : '';
  }
  if (!isUtf8(buf)) {
    try {
      return iconv.decode(buf, 'GB18030');
    } catch(e) {}
  }
  return String(buf);
}

function isString(path) {
  return path && typeof path === 'string';
}

function readSingleFile(path, callback) {
  if (!isString(path)) {
    return callback();
  }
  var stream = fs.createReadStream(path);
  var done, buf;
  var execCallback = function(err) {
    if (done) {
      return;
    }
    done = true;
    callback(err ? null : buf);
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

function getFileMap(list, callback) {
  if (Array.isArray(list)) {
    list = list.join('|');
  }
  if (!isString(list)) {
    return '';
  }
  var fileMap = {};
  list = list.split('|');
  list.forEach(function(file) {
    fileMap[file || ''] = 1;
  });
  return fileMap;
}

function readFileMap(list, callback) {
  var fileMap = getFileMap();
  if (!fileMap) {
    return callback('');
  }
  var files = Object.keys(fileMap);
  var len = files.length;
  files.forEach(function(file) {
    readSingleFile(file, function(data) {
      fileMap[file] = data;
      if (--len <= 0) {
        callback(fileMap);
      }
    });
  });
}

function readFileList(list, callback) {
  readFileMap(list, function(fileMap) {
    if (!fileMap) {
      return callback('');
    }
    var result = [];
    list.forEach(function(file) {
      result.push(fileMap[file]);
    });
    callback(result);
  });
}

function readFile(path, callback) {
  if (!isString(path)) {
    return callback();
  }
  readFileList(path.split('|'), function(result) {
    var list = [];
    result.forEach(function(buf) {
      if (buf) {
        list.push(buf, CRLF);
      }
    });
    list.pop();
    list = list.length ? Buffer.concat(list) : null;
    callback(list);
  });
}

function readFileText(path, callback) {
  if (!isString(path)) {
    return callback();
  }
  var list = path.split('|');
  readFileList(list, function(result) {
    callback(result.map(decode).filter(noop).join('\r\n'));
  });
}

function readFilesText(list, callback) {
  readFileList(list, function(result) {
    callback(result && result.map(decode));
  });
}

exports.decode = decode;
exports.readFile = readFile;
exports.readFileList = readFileList;
exports.readFileText = readFileText;
exports.readFilesText = readFilesText;
