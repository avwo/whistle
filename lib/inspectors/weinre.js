var Transform = require('pipestream').Transform;
var util = require('../../util');
var config = util.config;
var protocolLength = 'weinre://'.length;

function getWeinreScript(name) {
	return new Buffer('\r\n<script src="http://weinre.' + config.localUIHost + '/target/target-script-min.js#'
	+ name + '"></script>\r\n');
}

module.exports = function(req, res, next) {
	if (req.rules.weinre) {
		res.on('src', function(_res) {
			if (!util.supportHtmlTransform(_res)) {
				return;
			}
			var name = req.rules.weinre.matcher.substring(protocolLength);
			if (!name) {
				return;
			}
			
			var transform = new Transform();
			transform._transform = function(chunk, encoding, callback) {
				if (!chunk) {
					chunk = getWeinreScript(name);
				}
				callback(null, chunk);
			};
			
			res.addZipTransform(transform, false, true);
		
		});
	}
	
	next();
};