var httpsUtil = require('../../../../lib/https/util'); //后面再改

module.exports = function(req, res) {
	httpsUtil.getRootCA(function(err, key, crt) {
		err ? res.send(err.stack) : res.download(crt, 'rootCA.crt');
	});
};