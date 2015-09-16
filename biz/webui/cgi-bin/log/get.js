var proxy = require('../../lib/proxy');

module.exports = function(req, res) {
	
	res.json(proxy.getLogs(req.query.startTime));
};