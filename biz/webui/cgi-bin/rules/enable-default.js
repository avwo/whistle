var util = require('./util');

module.exports = function(req, res) {
	util.enableDefault();
	util.setDefault(req.body.content);
	res.json({ec: 0, em: 'success'});
};