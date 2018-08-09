var rules = require('../../lib/rules');
var util = require('../util');

module.exports = function(req, res) {
  if (!util.checkPluginForbidden(req, res)) {
    return;
  }
  res.json({ ec: 0 });
};
