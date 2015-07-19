var httpsUtil = require('../../../../lib/https/util'); //后面再改
var util = require('../../../../util');

module.exports = function(req, res) {
	httpsUtil.getRootCA(function(err, key, crt) {
		err ? res.send(util.getErrorStack(err)) : res.download(crt, 'rootCA.crt');
	});
};