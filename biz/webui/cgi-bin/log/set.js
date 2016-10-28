var proxy = require('../../lib/proxy');

module.exports = function(req, res) {
  proxy.addLog(req.query);
  res.setHeader('content-type', 'image/png');
  res.end();
};
