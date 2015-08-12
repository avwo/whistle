var rules = require('./util');

module.exports = function(req, res) {
	rules.rename(req.body.name, req.body.newName);
	res.json({ec: 0, em: 'success'});
};