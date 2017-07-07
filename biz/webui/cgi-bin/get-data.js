var proxy = require('../lib/proxy');
var util = require('./util');
var getData = require('../lib/data');

var logger = proxy.logger;

module.exports = function(req, res) {
  var data = req.query;
  if (data.ids && typeof data.ids == 'string') {
    data.ids = data.ids.split(',');
  } else {
    data.ids = null;
  }
  res.json({
    ec: 0,
    server: util.getServerInfo(req),
    log: proxy.getLogs(data.startLogTime, data.count),
    svrLog: logger.getLogs(data.startSvrLogTime, data.count),
    data: getData(data)
  });
};
