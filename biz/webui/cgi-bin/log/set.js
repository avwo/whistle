var proxy = require('../../lib/proxy');

module.exports = function(req, res) {
	proxy.addLog(req.body);
	res.json({ec: 0});
};