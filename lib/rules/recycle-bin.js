var fs  = require('fs');
var fse = require('fs-extra2');
var path = require('path');
var logger = require('../util/logger');
var ENCODING = {encoding: 'utf8'};

var NAME_RE = /^\d+\.([\s\S]+)$/;
var MAX_COUNT = 200;
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

function getName(item) {
  return item.name;
}

function RecycleBin(dir) {
  fse.ensureDirSync(dir);
  var list = [];
  var map = {};
  this._dir = dir;
  fs.readdirSync(dir).forEach(function(name) {
    if (NAME_RE.test(name)) {
      var item = {
        name: name,
        data: readFileSafe(path.join(dir, name))
      };
      map[name] = item;
      list.push(item);
    }
  });
  list.sort(function(a, b) {
    a = a.name;
    b = b.name;
    a = a.substring(0, a.indexOf('.'));
    b = b.substring(0, a.indexOf('.'));
    var aLen = a.length;
    var bLen = b.length;
    return aLen > bLen || (aLen === bLen && a > b) ? -1 : 1;
  });
  if (list.length > MAX_COUNT) {
    list.slice(MAX_COUNT).forEach(function(item) {
      try {
        delete map[item.name];
        fs.unlinkSync(path.join(dir, name));
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
  try {
    var name = Date.now() + '.' + encodeURIComponent(filename);
    data = data ? data + '' : '';
    var item = {
      name: name,
      data: data
    };
    this._list.unshift(item);
    this._map[name] = item;
    fs.writeFile(path.join(this._dir, name), data, noop);
  } catch (e) {
    logger.error(e);
  }
};

proto.recover = function(name) {
  var item = this._map[name];
  if (item) {
    delete this._map[name];
    this._list.splice(this._list.indexOf(item), 1);
    fs.unlink(path.join(this._dir, name), noop);
  }
  return item;
};

proto.remove = proto.recover;

proto.list = function() {
  return this._list.map(getName);
};

proto.getFile = function(name) {
  return this._map[name];
};

module.exports = RecycleBin;
