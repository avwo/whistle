var rules = require('../../../../lib/rules/util').rules;
var recycleBin = require('../../../../lib/rules/util').rules.recycleBin;
var isGroup = require('../../../../lib/util/common').isGroup;

module.exports = function(req, res) {
  var body = req.body;
  var list;
  var exists = rules.exists(body.name);
  if (rules.add(body.name, body.value, body.clientId) != null && !isGroup(body.name)) {
    if (body.groupName) {
      rules.moveToGroup(body.name, body.groupName, body.addToTop);
    } else if (body.addToTop) {
      rules.moveToTop(body.name, body.clientId);
    } else if (!exists) {
      var group = rules.getFirstGroup();
      group && rules.moveTo(body.name, group.name, body.clientId);
    }
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
