var properties = require('../../lib/properties');
var config = require('../lib/config');

module.exports = function(req, res) {
	var updateIt = false;
	var doNotShowAgainVersion = properties.get('doNotShowAgain');
	var latestVersion = properties.get('latestVersion');
	if (latestVersion && typeof latestVersion == 'string') {
		
	}
	
	res.json({
		ec: 0, 
		em: 'success', 
		updateIt: updateIt, 
		version: config.version,
		latestVersion: latestVersion
	});
};

