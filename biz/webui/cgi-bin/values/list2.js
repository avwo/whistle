var get = require('./index');

module.exports = function(req, res) {
  var data = {};
  get().list.forEach(function(item) {
    data[item.name] = item.data;
  });
  res.json(data);
};
