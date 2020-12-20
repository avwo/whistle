var recycleBin = require('../../../../../lib/rules/util').rules.recycleBin;

function getName(item) {
  return item.name;
}

module.exports = function(req, res) {
  res.json({
    ec: 0,
    list: recycleBin.list().map(getName)
  });
};
