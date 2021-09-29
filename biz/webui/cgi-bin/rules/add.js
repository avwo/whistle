var rules = require('../../../../lib/rules/util').rules;
var recycleBin = require('../../../../lib/rules/util').rules.recycleBin;

module.exports = function(req, res) {
  var body = req.body;
  var list;
  rules.add(body.name, body.value, body.clientId);
  if (body.addToTop) {
    rules.moveToTop(body.name, body.clientId);
  }
  if (req.body.recycleFilename) {
    recycleBin.remove(req.body.recycleFilename);
    list = recycleBin.list();
  }
  res.json({
    ec: 0,
    list: list
  });
};
