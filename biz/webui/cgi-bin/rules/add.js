var rules = require('../../lib/rules');

module.exports = function(req, res) {
	rules.add(req.body.name, req.body.content);
	res.json({ec: 0, em: 'success'});
};