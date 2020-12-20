var recycleBin = require('../../../../../lib/rules/util').values.recycleBin;

module.exports = function(req, res) {
  var item = recycleBin.getFile(req.query.name);
  res.json({
    ec: item ? 0 : 3,
    data: item && item.data
  });
};
