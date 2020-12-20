var recycleBin = require('../../../../../lib/rules/util').values.recycleBin;

function getName(item) {
  return item.name;
}

module.exports = function(req, res) {
  recycleBin.remove(req.body.name);
  res.json({
    ec: 0,
    list: recycleBin.list().map(getName)
  });
};
