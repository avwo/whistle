var Transform = require('pipestream').Transform;
var util = require('../../util');

function getWeinreScript(name, localUIHost) {
	return new Buffer('\r\n<script src="http://weinre.' + localUIHost + '/target/target-script-min.js#'
	+ name + '"></script>\r\n');
}

module.exports = function(req, res, next) {
	if (req.rules.weinre) {
		var localUIHost = this.config.localUIHost;
		res.on('src', function(_res) {
			if (!util.supportHtmlTransform(_res)) {
				return;
			}
			var name = util.getPath(util.rule.getMatcher(req.rules.weinre));
			if (!name) {
				return;
			}
			
			var transform = new Transform();
			transform._transform = function(chunk, encoding, callback) {
				if (!chunk) {
					chunk = getWeinreScript(name, localUIHost);
				}
				callback(null, chunk);
			};
			
			res.addZipTransform(transform, false, true);
		
		});
	}
	
	next();
};