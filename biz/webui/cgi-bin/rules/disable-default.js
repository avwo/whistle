var util = require('./util');

module.exports = function(req, res) {
	util.disableDefault();
	res.json({ec: 0, em: 'success'});
};