var proxy = require('../../lib/proxy');

module.exports = function(req, res) {
	proxy.addLog(req.query);
	res.json({ec: 0});
};