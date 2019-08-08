var get = require('./index');

module.exports = function(req, res) {
  var data = get();
  var list = data.list;
  list.unshift({
    name: 'Default',
    data: data.defaultRules,
    selected: !data.defaultRulesIsDisabled
  });
  res.json(list);
};
