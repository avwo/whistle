var values = require('../../../../lib/rules/util').values;

var LIMIMT_FILES_COUNT = values.LIMIMT_FILES_COUNT;

module.exports = function (req, res) {
  var files = values.getUploadFiles();
  var count = parseInt(req.body.count, 10) || 0;
  var len = files.length;
  var isMax = len >= LIMIMT_FILES_COUNT && count < LIMIMT_FILES_COUNT;
  var exists = values.existsFile(req.body.name);
  res.json({
    ec: 0,
    em: 'success',
    isMax: isMax,
    length: len,
    exists: exists,
    files: !isMax && exists ? undefined : files
  });
};
