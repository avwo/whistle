var AdmZip = require('adm-zip');
var parseString = require('xml2js').parseString;
var util = require('./util');

function parseMetaInfo(result, meta) {
  result.meta = meta;
}

module.exports = function(buffer, cb) {
  var zip = new AdmZip(buffer);
  var zipEntries = zip.getEntries();
  var sessions = {};
  var count = 0;
  var execCallback = function() {
    if (count <= 0) {
      cb(sessions || []);
    }
  };
  zipEntries.forEach(function(entry) {
    if (entry.isDirectory) {
      return;
    }
    var entryName = entry.entryName;
    var filename = entryName.substring(4);
    var dashIndex = filename.indexOf('_');
    if (dashIndex <= 0) {
      return;
    }
    var index = filename.substring(0, dashIndex);
    filename = filename.substring(dashIndex + 1).toLowerCase();
    if (!/^\d+$/.test(index) || ['c.txt', 'm.xml', 's.txt'].indexOf(filename) === -1) {
      return;
    }
    var content = zip.readAsText(entryName) || '';
    var result = sessions[index] = sessions[index] || {};
    if (filename === 'c.txt') {
      result.req = util.getReq(content);
    } else if (filename === 'm.xml') {
      ++count;
      parseString(content, function(err, meta) {
        parseMetaInfo(result, meta);
        --count;
        process.nextTick(execCallback);
      });
    } else {
      result.res = util.getRes(content);
    }
  });
  execCallback();
};