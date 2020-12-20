var recycleBin = require('../../../../../lib/rules/util').rules.recycleBin;

module.exports = function(req, res) {
  res.json({
    ec: 0,
    list: recycleBin.list()
  });
};
