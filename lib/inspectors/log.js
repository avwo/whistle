var fs = require('fs');
var path = require('path');
var Transform = require('pipestream').Transform;
var util = require('../util');
var logScript = fs.readFileSync(path.join(util.ASSESTS_PATH, 'js/log.js'), {encoding: 'utf8'});
var logHtmlScript;

module.exports = function(req, res, next) {
	if (req.rules.log) {
		var localUIHost = this.config.localUIHost;
		if (!logHtmlScript) {
			logScript = logScript.replace('$LOG_CGI', 'http://' + localUIHost + '/cgi-bin/log/set');
			logHtmlScript = '\r\n<script>' + logScript + '</script>\r\n';
		}
		res.on('src', function(_res) {
			var topScript, isHtml;
			if (util.supportHtmlTransform(_res)) {
				isHtml = true;
				topScript = logHtmlScript;
			} else if (util.getContentType(_res.headers) == 'JS') {
				topScript = logScript;
			}
			
			if (topScript) {
				topScript = new Buffer(topScript);
				var userScript;
				var transform = new Transform();
				var added;
				transform._transform = function(chunk, encoding, callback) {
					if (!chunk && userScript) {
						callback(null, userScript);
						return;
					}
					
					if (!added) {
						added = true;
						util.getRuleValue(req.rules.log, function(script) {
							if ((userScript = script || '') && isHtml) {
								userScript = new Buffer('\r\n<script>' + userScript + '</script>\r\n');
								callback(null, Buffer.concat([topScript, chunk || userScript]));
							} else {
								callback(null, chunk && Buffer.concat([topScript, chunk]));
							}
						});
						return;
					}
					
					callback(null, chunk);
				};
				
				res.addZipTransform(transform, false, true);
			}
		});
	}
	
	next();
};