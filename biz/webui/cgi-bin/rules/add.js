var rules = require('../../../../lib/rules/util').rules;
var recycleBin = require('../../../../lib/rules/util').rules.recycleBin;
var isGroup = require('../../../../lib/util/common').isGroup;

module.exports = function(req, res) {
  var body = req.body;
  var list;
  if (body.name === 'Default') {
    rules.setDefault(body.value, body.clientId);
    body.selected && rules.enableDefault();
  } else {
    var exists = rules.exists(body.name);
    if (rules.add(body.name, body.value, body.clientId) != null) {
      if (isGroup(body.name)) {
        if (body.focusName) {
          rules.moveTo(body.name, body.focusName, body.clientId);
        }
      } else if (body.groupName) {
        rules.moveToGroup(body.name, body.groupName, body.addToTop);
      } else if (body.addToTop) {
        rules.moveToTop(body.name, body.clientId);
      } else if (!exists) {
        var group = rules.getFirstGroup();
        group && rules.moveTo(body.name, group.name, body.clientId);
      }
    }
    body.selected && rules.select(body.name);
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
