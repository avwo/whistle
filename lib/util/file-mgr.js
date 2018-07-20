var fs = require('fs');

var MAX_SIZE = 1024 * 1024 * 64;

var noop = function(_) {
  return _;
};

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
  list = list.split('|').filter(noop);
  if (!list.length) {
    return callback();
  }
  var fileMap = {};
  list.forEach(function(file) {
    fileMap[file] = 1;
  });
  var files = Object.keys(fileMap);
  var len = files.length;
  var result;
  var execCallback = function() {
    if (--len > 0) {
      return;
    }
    list.forEach(function(file) {
      var data = fileMap[file];
      if (data) {
        result = result || [];
        result.push(data);
      }
    });
    callback(null, result);
  };
  files.forEach(function(file) {
    readFile(file, function(err, data) {
      fileMap[file] = data;
      execCallback();
    });
  });
}

exports.readFile = readFile;
exports.readFiles = readFiles;
