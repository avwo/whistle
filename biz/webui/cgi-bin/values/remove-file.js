var values = require('../../../../lib/rules/util').values;

module.exports = function (req, res) {
  values.removeUploadFile(req.body.name, function(err) {
    var result = { ec: 0, em: 'success' };
    if (err) {
      result.ec = 2;
      result.em = err.message || 'Internal Serve Error';
    } else {
      result.files = values.getUploadFiles();
    }
    res.json(result);
  });
};
