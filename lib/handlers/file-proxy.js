var fs = require('fs');
var util = require('util');
var commonUtil = require('../../util');
var url = require('url');
var mime = require('mime');
var config = commonUtil.config;
var rules = require('../rules');
var dust = require('dustjs-helpers');
var Readable = require('stream').Readable;
var querystring = require('querystring');


module.exports = function(req, res, next) {
	var options = req.options;
	var protocol = options && options.protocol;
	if (!/^(?:|x|xs)(?:file|dust):$/.test(protocol)) {
		next();
		return;
	}
	
	var path = commonUtil.getPath(options.url);
	try {
		path = decodeURIComponent(path);
	 } catch (e) {
		path = QueryString.unescape(path);
	 }
	 
	fs.stat(path, function(err, stat){
	    if(err || !stat.isFile()) { 
	    	if (/^x/.test(protocol)) {
				  util._extend(options, url.parse(req.fullUrl));
				  if (/^xs/.test(protocol)) {
					  options.protocol = 'https:';
				  }
				 
				  rules.resolveHost(options.hostname, function(err, ip) {
					  options.host = ip;
					  next(err);
				  });
			  } else {
				  next(err || new Error('Not found file ' + path));
			  }
	    	return;
	    }

	    commonUtil.drain(req, function() {
	    	var reader = fs.createReadStream(path);
		    reader.statusCode = 200;
		    reader.headers = {
			    	'Content-Type': mime.lookup(path) + '; charset=utf-8',
			    	Server: config.name
			    };
		    if (/dust:$/.test(protocol)) {
		    	var content = '';
		    	reader.setEncoding('utf8');
		    	reader.on('data', function(data) {
		    		content += data;
		    	});
		    	reader.on('end', function() {
		    		var index = req.url.indexOf('?') + 1;
		    		dust.compileFn(content)(index > 0 ? querystring.parse(req.url.substring(index).replace(/#.*$/, '')) : {}, 
		    				function(err, data) {
				    			if (err) {
				    				next(err);
				    				return;
				    			}
				    			reader.body = data;
				    			res.response(commonUtil.wrapResponse(reader));
		    		});
		    	});
		    	
		    	reader.on('error', next);
		    } else {
		    	res.response(reader);
		    }
	    });
	    
	});
};