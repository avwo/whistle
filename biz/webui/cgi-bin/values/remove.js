var values = require('../../lib/values');

module.exports = function(req, res) {
	values.remove(req.body.key);
	res.json({ec: 0, em: 'success'});
};