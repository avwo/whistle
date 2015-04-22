var metaUtil = require('../../lib/meta-util');

module.exports = function(req, res) {
	var data = metaUtil.getHostsData();
	data.fontSize = metaUtil.getProperty('fontSize');
	data.showLineNumbers = metaUtil.getProperty('showLineNumbers');
	data.theme = metaUtil.getProperty('theme');
	res.json(data);
};