var Transform = require('pipestream').Transform;
var config = require('../../util').config;
var protocolLength = 'weinre://'.length;

function getWeinreScript(name) {
	return '<script src="http://weinre.' + config.localUIHost + '/target/target-script-min.js#'
	+ name + '"></script>';
}

module.exports = function(req, res, next) {
	if (req.rules.weinre) {
		res.on('src', function(_res) {
			var url = req.rules.weinre.url.substring(protocolLength);
			if (url) {
				var transform = new Transform();
				transform._transform = function(chunk, encoding, callback) {
					if (!chunk) {
						chunk = getWeinreScript(url);
					}
					callback(null, encoding);
				};
				if (util.supportHtmlTransform(_res)) {
					res.addZipTransform(transform, false, true);
				}
			}
		});
	}
	
	next();
};