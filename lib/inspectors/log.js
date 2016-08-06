var fs = require('fs');
var path = require('path');
var Transform = require('pipestream').Transform;
var util = require('../util');
var config = require('../config');
var logScriptFile = path.join(config.ASSESTS_PATH, 'js/log.js');
var logScript = fs.readFileSync(logScriptFile, {encoding: 'utf8'});
var logHtmlScript, logHttpsHtmlScript, logHttpsScript;

function wrapScript(script, isHtml) {
	
	return isHtml ? '\r\n<script>' + script + '</script>\r\n' : '\r\n' + script;
}

module.exports = function(req, res, next) {
	if (req.rules.log) {
		if (!logHtmlScript) {
			var logCgi = '//' + this.config.localUIHost + '/cgi-bin/log/set'; 
			logHttpsScript = logScript.replace('$LOG_CGI', 'https:' + logCgi);
			logScript = logScript.replace('$LOG_CGI', 'http:' + logCgi);
			logHttpsHtmlScript = '<!DOCTYPE html>\r\n<script>' + logHttpsScript + '</script>\r\n';
			logHtmlScript = '<!DOCTYPE html>\r\n<script>' + logScript + '</script>\r\n';
		}
		util.disableReqCache(req.headers);
		res.on('src', function(_res) {
			var topScript, isHtml;
			if (util.supportHtmlTransform(_res)) {
				isHtml = true;
				topScript = req.isHttps ? logHttpsHtmlScript : logHtmlScript;
			} else if (util.getContentType(_res.headers) == 'JS') {
				topScript = req.isHttps ? logHttpsScript : logScript;
			}
			
			if (topScript) {
				delete _res.headers['content-security-policy'];
				delete _res.headers['content-security-policy-report-only'];
				if (!isHtml) {
					_res.headers['access-control-allow-origin'] = '*';
				}
				topScript = new Buffer(topScript);
				var userScript;
				var transform = new Transform();
				var added;
				transform._transform = function(chunk, encoding, callback) {
					if (!added) {
						added = true;
						util.getRuleValue(req.rules.log, function(script) {
							if (userScript = script || null) {
								userScript = new Buffer(wrapScript(userScript, isHtml));
							}
							
							var buf = [topScript];
							if ((isHtml || !chunk) && userScript) {
								buf.push(userScript);
								userScript = null;
							} 
							chunk && buf.push(chunk);
							callback(null, Buffer.concat(buf));
						});
					} else {
						callback(null, chunk || userScript);
					}
				};
				
				res.addZipTransform(transform, false, true);
			}
		});
	}
	
	next();
};