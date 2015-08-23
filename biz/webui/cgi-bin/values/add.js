var values = require('../../lib/values');

module.exports = function(req, res) {
	values.add(req.body.key, req.body.value);
	res.json({ec: 0, em: 'success'});
};