var values = require('../../../../lib/rules/util').values;

module.exports = function(req, res) {
  values.download(req.query.name, res);
};
