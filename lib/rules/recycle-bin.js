var fs  = require('fs');
var fse = require('fs-extra2');
var path = require('path');
var logger = require('../util/logger');
var ENCODING = {encoding: 'utf8'};

var NAME_RE = /^(\d+)\.([\s\S]+)$/;
var MAX_COUNT = 120;
var noop = function() {};

function readFileSafe(file, retry) {
  try {
    file = fs.readFileSync(file, ENCODING);
  } catch (e) {
    if (retry) {
      file = null;
    } else {
      return readFileSafe(file, true);
    }
  }

  return file || '';
}

function RecycleBin(dir) {
  fse.ensureDirSync(dir);
  var list = [];
  var map = {};
  fs.readdirSync(dir).forEach(function(name) {
    if (NAME_RE.test(name) && RegExp.$1.length < 16) {
      var date = parseInt(RegExp.$1, 10);
      var filename;
      try {
        filename = decodeURIComponent(RegExp.$2);
      } catch(e) {
        return logger.error(e);
      }
      var data = readFileSafe(path.join(dir, name));
      var item = {
        date: date,
        name: filename,
        data: data
      };
      map[name] = item;
      list.push(item);
    }
  });
  list.sort(function(a, b) {
    return a.date > b.date ? -1 : 1;
  });
  if (list.length > MAX_COUNT) {
    list.slice(MAX_COUNT).forEach(function(item) {
      try {
        var name = item.date + '.' + encodeURIComponent(item.name);
        delete map[name];
        fs.unlinkSync(name);
      } catch (e) {}
    });
    list = list.slice(0, MAX_COUNT);
  }
  this._list = list;
  this._map = map;
}

var proto = RecycleBin.prototype;

proto.recycle = function(filename, data) {
  if (!filename) {
    return;
  }
  var now = Date.now();
  try {
    var name = now + '.' + encodeURIComponent(filename);
    data = data ? data + '' : '';
    var item = {
      date: now,
      name: filename,
      data: data
    };
    this._list.unshift(item);
    this._map[name] = item;
    fs.writeFile(name, data, noop);
  } catch (e) {
    logger.error(e);
  }
};

proto.recover = function(name) {
  var item = this._map[name];
  if (item) {
    fs.unlink(name, noop);
    delete this._map[name];
    this._list.splice(this._list.indexOf(item), 1);
  }
  return item;
};

proto.remove = proto.recover;

proto.list = function() {
  return this._list;
};

module.exports = RecycleBin;
