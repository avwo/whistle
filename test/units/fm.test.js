var path = require('path');
var assert = require('assert');
var fm = require('../../lib/util/file-mgr');

module.exports = function() {
  var file1 = path.join(__dirname, '../assets/files/1.txt');
  var file2 = path.join(__dirname, '../assets/files/2.txt');
  var file3 = path.join(__dirname, '../assets/files/3.txt');
  var path1 = file1 + '|' + file2;
  var path2 = file2 + '|' + file3;
  var path3 = file3 + '|' + file1;
  fm.readFile(path1, function(result) {
    assert(result.length === 4, 'Error');
  });
  fm.readFileList([null, null, path1, path2, null], function(result) {
    assert(result.length === 5, 'Error');
  });
  fm.readFileList(null, function(result) {
    assert(!result, 'Error');
  });
  fm.readFileList([null, null, null], function(result) {
    assert(result.length === 3, 'Error');
  });
  fm.readFileList([], function(result) {
    assert(!result, 'Error');
  });
  fm.readFilesText([null, null, path1, path2, null], function(result) {
    assert(result[2] === '1\r\n2', 'Error');
  });
  fm.readFilesText(null, function(result) {
    assert(!result, 'Error');
  });
  fm.readFilesText([], function(result) {
    assert(!result, 'Error');
  });
  fm.readFilesText([null, null, null], function(result) {
    assert(result.length === 3, 'Error');
  });
  fm.readFile(path1, function(result) {
    assert(result.length === 4, 'Error');
  });
  fm.readFileText(path3, function(result) {
    assert(result === '3\r\n1', 'Error');
  });
};

module.exports();