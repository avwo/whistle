var properties = require('../lib/properties');

module.exports = function(req, res) {
  res.json(properties.getHistory());
};
