var values = require('../../../../lib/rules/util').values;

module.exports = function (req, res) {
  var files = values.getUploadFiles();
  var name = req.query.name;
  res.json({
    ec: 0,
    em: 'success',
    length: files.length,
    files: name && files.indexOf(name) === -1 ? undefined : files
  });
};
