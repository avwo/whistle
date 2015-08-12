var util = require('./util');

module.exports = function(req, res) {
	util.rename(req.body.name, req.body.newName);
	res.json({ec: 0, em: 'success'});
};