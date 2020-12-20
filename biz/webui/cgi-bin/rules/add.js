var rules = require('../../../../lib/rules/util').rules;
var recycleBin = require('../../../../lib/rules/util').rules.recycleBin;

module.exports = function(req, res) {
  var body = req.body;
  rules.add(body.name, body.value, body.clientId);
  if (req.body.recycleFilename) {
    recycleBin.remove(req.body.recycleFilename);
  }
  res.json({
    ec: 0,
    list: recycleBin.list()
  });
};
