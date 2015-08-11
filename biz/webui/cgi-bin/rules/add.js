var util = require('./util');

module.exports = function(req, res) {
	util.add(req.body.name, req.body.content);
	res.json({ec: 0, em: 'success'});
};