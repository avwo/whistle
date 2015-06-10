var fs = require('fs');
var extend = require('util')._extend;
var util = require('../../util');
var url = require('url');
var mime = require('mime');
var rules = require('../rules');
var querystring = require('querystring');


module.exports = function(req, res, next) {
	var options = req.options;
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
	
	var path = util.getPath(util.rule.getUrl(options.rule));
	try {
		path = decodeURIComponent(path);
	 } catch (e) {
		path = QueryString.unescape(path);
	 }
	 
	fs.stat(path, function(err, stat){
	    if(err || !stat.isFile()) { 
	    	if (/^x/.test(protocol)) {
				  extend(options, url.parse(req.fullUrl));
				  if (/^xs/.test(protocol)) {
					  options.protocol = 'https:';
				  }
				 
				  rules.resolveHost(req.fullUrl, function(err, ip) {
					  if (err) {
						  util.emitError(req, err);
						  res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + err.stack));
						  return;
					  }
					  options.host = ip;
					  next();
				  });
			  } else {
				  util.emitError(req, err || new Error('Not found file ' + path));
			  }
	    	return;
	    }

	    util.drain(req, function() {
	    	var reader = fs.createReadStream(path);
		    reader.statusCode = 200;
		    reader.headers = {
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
		
		res.response(util.wrapResponse(reader));
	}
};