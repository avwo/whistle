var fs = require('fs');
var extend = require('util')._extend;
var util = require('../../util');
var url = require('url');
var mime = require('mime');
var rules = require('../rules');
var querystring = require('querystring');


function decodePath(path) {
	try {
		return decodeURIComponent(path);
	 } catch (e) {}
	 
	return QueryString.unescape(path);
}

module.exports = function(req, res, next) {
	var options = req.options;
	var config = this.config;
	var protocol = options && options.protocol;
	if (!/^(?:|x|xs)(?:file|dust|tpl|jsonp):$/.test(protocol)) {
		next();
		return;
	}
	
	if (options.rule.value) {
		util.drain(req, function() {
			var key = options.rule.key;
			var reader = {
					statusCode: 200,
					body: util.removeProtocol(options.rule.value, true),
					headers: {
					    	'content-type': (key ? mime.lookup(key) : 'text/html') + '; charset=utf-8'
					    }
			};
			
		    if (/(?:dust|tpl|jsonp):$/.test(protocol)){
		    	render(reader);
		    } else {
		    	res.response(util.wrapResponse(reader));
		    }
		});
		return;
	}
	
	var path = decodePath(util.getPath(util.rule.getUrl(options.rule)));
	
	fs.stat(path, function(err, stat){
	    if(err || !stat.isFile()) { 
	    	if (/^x/.test(protocol)) {
				  extend(options, url.parse(req.fullUrl));
				  if (/^xs/.test(protocol)) {
					  options.protocol = 'https:';
				  }
				 
				  rules.resolveHost(req.fullUrl, function(err, ip, customHost) {
					  req.customHost = customHost;
					  if (err) {
						  util.emitError(req, err);
						  util.drain(req, function() {
							  res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + err.stack));
							});
						  return;
					  }
					  options.host = ip;
					  next();
				  });
			  } else {
				  res.response(util.wrapResponse({
						statusCode: 404,
						body: 'Not found file <strong>' + path + '</strong>',
						headers: {
						    	'content-type': 'text/html; charset=utf-8'
						    }
				}));
			  }
	    	return;
	    }

	    util.drain(req, function() {
	    	var reader = fs.createReadStream(path);
		    reader.statusCode = 200;
		    reader.realUrl = path;
		    reader.headers = {
		    		'server': config.name,
			    	'content-type': mime.lookup(path) + '; charset=utf-8'
			    };
		    
		    if (/(?:dust|tpl|jsonp):$/.test(protocol)) {
		    	var content = '';
		    	reader.setEncoding('utf8');
		    	reader.on('data', function(data) {
		    		content += data;
		    	});
		    	reader.on('end', function() {
		    		reader.body = content;
		    		render(reader);
		    	});
		    	
		    	reader.on('error', function(err) {
		    		util.emitError(req, err);
		    	});
		    } else {
		    	res.response(reader);
		    }
	    });
	    
	});
	
	function render(reader) {
		if (reader.body) {
			var index = req.url.indexOf('?') + 1;
			index = index > 0 && req.url.substring(index).replace(/#.*$/, '');
			var data = index && querystring.parse(index);
			if (data) {
				reader.body = reader.body.replace(/\{([\w\-$]+)\}/g, function(all, matched) {
					return matched in data ? data[matched] : all;
				});
			}
		}
		var realUrl = reader.realUrl;
		reader = util.wrapResponse(reader);
		reader.realUrl = realUrl;
		res.response(reader);
	}
};