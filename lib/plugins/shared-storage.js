var fse = require('fs-extra2');
var fs = require('fs');
var copyFile = require('../util/common').copyFile;

var UTF8_OPTIONS = { encoding: 'utf8' };

function ensureFile(filepath) {
  return new Promise(function(resolve, reject) {
    fse.ensureFile(filepath, function(err) {
      if (err ) {
        return reject(err);
      }
      resolve();
    });
  });
}

function writeJson(filepath, obj, bkFile) {
  return new Promise(async function(resolve, reject) {
    await ensureFile(filepath);
    fse.writeJson(filepath, obj, function(err) {
      if (err) {
        return reject(err);
      }
      copyFile(filepath, bkFile, function() {
        resolve(obj);
      });
    });
  });
}

function notExists(err) {
  return err.code === 'ENOENT';
}

function readJson(filepath, bkFile) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filepath, UTF8_OPTIONS, function(err, ctn) {
      if (err) {
        return notExists(err) ? resolve({}) : reject(err);
      }
      if (ctn) {
        try {
          ctn = JSON.parse(ctn) || {};
          resolve(typeof ctn === 'object'? ctn : {});
        } catch (e) {
          reject(e);
        }
        return;
      }
      fse.readJson(bkFile, function(_, obj) {
        resolve(obj || {});
      });
    });
  });
}

module.exports = function(filepath) {
  var bkFile = filepath + '.bk';
  var getAll = async function() {
    try {
      return await readJson(filepath, bkFile);
    } catch (e) {}
    return readJson(filepath, bkFile);
  };

  var writeAll = async function(obj) {
    try {
      return await writeJson(filepath, obj, bkFile);
    } catch (e) {}
    return writeJson(filepath, obj, bkFile);
  };

  var setItem = async function(key, value) {
    var obj = await getAll();
    if (key && typeof key === 'object') {
      Object.keys(key).forEach(function(k) {
        obj[k] = key[k];
      });
    } else {
      obj[key] = value;
    }
    return writeAll(obj);
  };

  var getItem = async function(key) {
    var obj = await getAll();
    return obj[key];
  };

  var removeItem = async function(key) {
    var obj = await getAll();
    if (Array.isArray(key)) {
      key.forEach(function(k) {
        delete obj[k];
      });
    } else if (key && typeof key === 'object') {
      Object.keys(key).forEach(function(k) {
        delete obj[k];
      });
    } else {
      delete obj[key];
    }
    return writeAll(obj);
  };

  return {
    getAll: getAll,
    setAll: writeAll,
    setItem: setItem,
    getItem: getItem,
    removeItem: removeItem
  };
};
