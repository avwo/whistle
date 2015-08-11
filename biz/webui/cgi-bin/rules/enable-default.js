var util = require('./util');

module.exports = function(req, res) {
	util.enableDefaultRules();
	util.setDefault(req.body.content);
	res.json({ec: 0, em: 'success'});
};