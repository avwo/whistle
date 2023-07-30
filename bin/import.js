var fs = require('fs');

function importModle(filepath, callback) {
  return import(filepath).then(callback);
}

module.exports = function(filepath, callback) {
  try {
    return callback(require(filepath));
  } catch (e) {
    var code =e && e.code;
    if (code === 'ERR_REQUIRE_ESM') {
      // ignore eslint & fix type=module
      return importModle(filepath, callback);
    } else if (code === 'MODULE_NOT_FOUND' && /\.js$/i.test(filepath)) {
      filepath = filepath.slice(0, -3) + '.mjs';
      if (fs.existsSync(filepath)) {
        return importModle(filepath, callback);
      }
    }
    throw e;
  }
};
