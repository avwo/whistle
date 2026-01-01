var get = require('./index');

module.exports = function(req, res) {
  var data;
  if (req.query.order) {
    data = [];
    get().list.forEach(function(item) {
      data.push({
        name: item.name,
        value: item.data
      });
    });
  } else {
    var list = [];
    data = {};
    get().list.forEach(function(item) {
      data[item.name] = item.data;
      list.push(item.name);
    });
    data[''] = list;
  }
  res.json(data);
};
