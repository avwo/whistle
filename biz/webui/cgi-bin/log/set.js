var proxy = require('../../lib/proxy');

module.exports = function(req, res) {
	proxy.addLog(req.body.log);
	res.json({ec: 0});
};