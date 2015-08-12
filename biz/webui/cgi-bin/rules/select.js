var rules = require('../../lib/rules');

module.exports = function(req, res) {
	rules.add(req.body.name, req.body.content);
	rules.select(req.body.name);
	res.json({ec: 0, em: 'success'});
};