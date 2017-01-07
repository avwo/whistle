var AdmZip = require('adm-zip');
var util = require('./util');

module.exports = function(buffer) {
  var zip = new AdmZip(buffer);
  var zipEntries = zip.getEntries();
  zipEntries = zipEntries.map(function(entry) {
    return entry.isDirectory ? null : {
      name: entry.entryName,
      value: util.getReq(zip.readAsText(entry.entryName))
    };
  });
  return zipEntries;
};