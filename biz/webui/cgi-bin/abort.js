var proxy = require('../lib/proxy');


module.exports = function(req, res) {
  var list = req.body.list;
  if (list && typeof list === 'string') {
    list.split(',').forEach(proxy.abortRequest);
  }
  res.json({ ec: 0 });
};
