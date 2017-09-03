var get = require('./index');

module.exports = function(req, res) {
  res.json(get());
};
