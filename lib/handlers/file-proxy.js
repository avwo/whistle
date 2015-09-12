var fs = require('fs');
var extend = require('util')._extend;
var util = require('../util');
var url = require('url');
var mime = require('mime');
var rules = require('../rules');
var querystring = require('querystring');


function decodePath(path) {
	path = util.getPath(path, true);
	try {
		return decodeURIComponent(path);
	 } catch (e) {}
	 
	 try {
		 return querystring.unescape(path);
	 } catch(e) {}
	 
	return path;
}

function readFiles(files, callback) {
	var file = files.shift();
	var execCallback = function(err, stat) {
		 if(!err && stat && stat.isFile()) { 
			 callback(null, file);
		 } else if (files.length) {
			 readFiles(files, callback);
		 }  else {
			 callback(err || new Error('Not found file ' + file), file);
		 }
	};
	
	!file ||typeof file != 'string' ? execCallback() : fs.stat(file, execCallback);
}

module.exports = function(req, res, next) {
	var options = req.options;
	var config = this.config;
	var protocol = options && options.protocol;
	if (!/^(?:|x|xs)(?:file|dust|tpl|jsonp):$/.test(protocol)) {
		next();
		return;
	}
	var defaultType = mime.lookup(req.fullUrl.replace(/[?#].*$/, ''), 'text/html');
	var rule = req.rules.rule;
	if (rule.value) {
		util.drain(req, function() {
			var key = rule.key;
			var reader = {
					statusCode: 200,
					body: util.removeProtocol(rule.value, true),
					headers: {
					    	'content-type': (key ? mime.lookup(key, defaultType) : defaultType) + '; charset=utf-8'
					    }
			};
			
		    if (/(?:dust|tpl|jsonp):$/.test(protocol)){
		    	reader.realUrl = rule.matcher;
		    	render(reader);
		    } else {
		    	reader = util.wrapResponse(reader);
		    	reader.realUrl = rule.matcher;
		    	res.response(reader);
		    }
		});
		return;
	}
	
	var files = rule.files || [util.getPath(util.rule.getUrl(rule))];
	files = files.map(function(file) {
		return decodePath(file);
	});
	
	readFiles(files, function(err, path) {
		if (err) { 
	    	if (/^x/.test(protocol)) {
				  extend(options, url.parse(/^xs/.test(protocol) ? req.fullUrl.replace(/^http:/, 'https:') : req.fullUrl));
				  next();
			  } else {
				  util.drain(req, function() {
					 res.response(util.wrapResponse({
							statusCode: 404,
							body: 'Not found file <strong>' + path + '</strong>',
							headers: {
							    	'content-type': 'text/html; charset=utf-8'
							    }
					}));
				  });
			  }
	    	return;
	    }
		
	    util.drain(req, function() {
	    	var headers = {
		    		'server': config.name,
			    	'content-type': mime.lookup(path, defaultType) + '; charset=utf-8'
			    };
	    	
		    if (/(?:dust|tpl|jsonp):$/.test(protocol)) {
		    	var reader = {
		    			statusCode: 200,
		    			realUrl: path,
		    			headers: headers
		    	};
		    	fs.readFile(path, {encoding: 'utf8'}, function(err, data) {
		    		if (err) {
		    			return util.emitError(req, err);
		    		}
		    		reader.body = data;
		    		render(reader);
		    	});
		    } else {
		    	var reader = fs.createReadStream(path);
			    reader.statusCode = 200;
			    reader.realUrl = path;
			    reader.headers = headers;
		    	res.response(reader);
		    }
	    });
	    
	});
	
	function render(reader) {
		if (reader.body) {
			var params = req.rules.params;
			var data = querystring.parse(params && params.query || util.getQueryString(req.url));
			if (!util.isEmptyObject(data)) {
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