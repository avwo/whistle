var util = require('./util');

module.exports = function(req, res) {
	util.unselect(req.body.name);
	res.json({ec: 0, em: 'success'});
};