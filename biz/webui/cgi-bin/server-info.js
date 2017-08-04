var util = require('./util');

module.exports = function(req, res) {
  res.json({ec: 0, server: util.getServerInfo(req)});
};
