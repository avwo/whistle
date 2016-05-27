var proxy = require('../lib/proxy');
var getData = require('../lib/data');

module.exports = function(req, res) {
	var data = req.query;
	if (data.ids && typeof data.ids == 'string') {
		data.ids = data.ids.split(',');
	} else {
		data.ids = null;
	}
	res.json({
				ec: 0, 
				log: proxy.getLogs(data.startLogTime, data.count),
				sysLog: proxy.getLogs(data.startSysLogTime, data.count),
				data: getData(data)
			});
};