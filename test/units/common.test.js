var path = require('path');
var fs = require('fs');
var isUtf8 = require('../../lib/util/is-utf8');
var createStorage = require('../../lib/rules/storage');

var BASE_DIR = path.join(__dirname, '../assets/files/');

module.exports = function() {
  var gb2312Buf = fs.readFileSync(path.join(BASE_DIR, 'gb2312.txt'));
  isUtf8(gb2312Buf).should.equal(false);
  createStorage(path.join(BASE_DIR, 'storage'));
};