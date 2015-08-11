var util = require('./util');

module.exports = function(req, res) {
	util.disableDefaultRules();
	res.json({ec: 0, em: 'success'});
};