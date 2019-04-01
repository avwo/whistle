var values = require('../../../../lib/rules/util').values;

module.exports = function (req, res) {
  var files = values.getUploadFiles();
  var name = req.query.name;
  var len = files.length;
  var isMax = len >= values.LIMIMT_FILES_COUNT;
  res.json({
    ec: 0,
    em: 'success',
    isMax: isMax,
    length: len,
    files: !isMax && name && files.indexOf(name) === -1 ? undefined : files
  });
};
