var values = require('../../lib/values');

module.exports = function(req, res) {
	values.rename(req.body.name, req.body.newName);
	res.json({ec: 0, em: 'success'});
};