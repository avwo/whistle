var util = require('./util');

module.exports = function(req, res) {
	util.add(req.body.name, req.body.content);
	util.select(req.body.name);
	res.json({ec: 0, em: 'success'});
};