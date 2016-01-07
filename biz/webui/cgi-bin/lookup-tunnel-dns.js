var rules = require('../lib/proxy').rules;

module.exports = function(req, res) {
	var hostname = req.query.hostname;
	if (hostname && typeof hostname == 'string') {
		rules.resolveHost(hostname, function(err, host) {
			if (err) {
				res.json({ec: 2, em: 'server busy'});
			} else {
				res.json({ec: 0, em: 'success', hostname: hostname, host: host});
			}
		});
	} else {
		res.json({ec: 2, em: 'server busy'});
	}
};