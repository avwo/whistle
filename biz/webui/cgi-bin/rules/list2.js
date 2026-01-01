var get = require('./index');

module.exports = function(req, res) {
  var rules = get();
  var data;
  if (req.query.order) {
    data = [{
      name: 'Default',
      value: rules.defaultRules
    }];
    rules.list.forEach(function(item) {
      data.push({
        name: item.name,
        value: item.data
      });
    });
  } else {
    var list = ['Default'];
    data = {
      Default: rules.defaultRules
    };
    rules.list.forEach(function(item) {
      data[item.name] = item.data;
      list.push(item.name);
    });
    data[''] = list;
  }
  res.json(data);
};
