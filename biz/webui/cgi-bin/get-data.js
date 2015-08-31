var getData = require('../lib/data');

module.exports = function(req, res) {
	var data = req.query;
	if (data.ids && typeof data.ids == 'string') {
		data.ids = data.ids.split(',');
	} else {
		data.ids = null;
	}
	res.json(getData(data));
};