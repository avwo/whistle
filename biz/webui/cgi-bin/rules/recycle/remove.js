var recycleBin = require('../../../../../lib/rules/util').rules.recycleBin;

module.exports = function(req, res) {
  recycleBin.remove(req.body.name);
  res.json({
    ec: 0,
    list: recycleBin.list()
  });
};
