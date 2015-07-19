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
	var rule = req.rules.rule;
	if (rule.value) {
		util.drain(req, function() {
			var key = rule.key;
			var reader = {
					statusCode: 200,
					body: util.removeProtocol(rule.value, true),
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