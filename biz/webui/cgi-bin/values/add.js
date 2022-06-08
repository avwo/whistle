var values = require('../../../../lib/rules/util').values;
var recycleBin = require('../../../../lib/rules/util').values.recycleBin;
var isGroup = require('../../../../lib/util/common').isGroup;

module.exports = function(req, res) {
  var body = req.body;
  var list;
  if (values.add(body.name, body.value, body.clientId, body.groupName) && isGroup(body)) {
    var group = values.getFirstGroup();
    group && values.moveTo(body.name, group.name, body.clientId);
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
