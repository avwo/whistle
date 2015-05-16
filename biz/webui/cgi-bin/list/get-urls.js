var rulesUtil = require('../../lib/rules-util');
var dataUtil = require('../../lib/data/util');


module.exports = function(req, res) {
	var query = req.query;
	
	dataUtil.getUrls(parseInt(query.startDate), parseInt(query.endDate), 
			typeof query.keyword == 'string' ? query.keyword.trim() : '', function(list) {
				res.json(list);
	});
};