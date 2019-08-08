var get = require('./index');

module.exports = function(req, res) {
  var rules = get();
  var data = {
    Default: rules.defaultRules
  };
  rules.list.forEach(function(item) {
    data[item.name] = item.data;
  });
  res.json(data);
};
