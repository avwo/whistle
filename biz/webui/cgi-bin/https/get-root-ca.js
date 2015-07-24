var httpsUtil = require('../../../../lib/https/util'); //后面再改

module.exports = function(req, res) {
	res.download(httpsUtil.getRootCAFile(), 'rootCA.crt');
};