var values = require('../../../../lib/rules/util').values;
var recycleBin = require('../../../../lib/rules/util').values.recycleBin;
var isGroup = require('../../../../lib/util/common').isGroup;

module.exports = function(req, res) {
  var body = req.body;
  var list;
  var exists = values.exists(body.name);
  if (values.add(body.name, body.value, body.clientId) != null) {
    if (isGroup(body.name)) {
      if (body.focusName) {
        values.moveTo(body.name, body.focusName, body.clientId);
      }
    } else if (body.groupName) {
      values.moveToGroup(body.name, body.groupName);
    } else if (!exists) {
      var group = values.getFirstGroup();
      group && values.moveTo(body.name, group.name, body.clientId, null, true);
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
