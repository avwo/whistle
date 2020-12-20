var values = require('../../../../lib/rules/util').values;
var recycleBin = require('../../../../lib/rules/util').values.recycleBin;

module.exports = function(req, res) {
  var body = req.body;
  values.add(body.name, body.value, body.clientId);
  if (req.body.recycleFilename) {
    recycleBin.remove(req.body.recycleFilename);
  }
  res.json({
    ec: 0,
    list: recycleBin.list()
  });
};
