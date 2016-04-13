var fs = require('fs');
var extend = require('util')._extend;
var util = require('../util');
var url = require('url');
var mime = require('mime');
var rules = require('../rules');
var querystring = require('querystring');
var PassThrough = require('stream').PassThrough;
var protoMgr = require('../rules/protocols');
var CRLF_RE = /\r\n|\r|\n/g;
var RAW_FILE_RE = /rawfile/;
var HEADERS_SEP_RE = /(\r?\n(?:\r\n|\r|\n)|\r\r\n?)/;
var MAX_HEADERS_SIZE = 256 * 1024;
var TPL_RE = /(?:dust|tpl|jsonp):$/;

function isTplProtocol(protocol) {
	return TPL_RE.test(protocol);
}

function isRawFileProtocol(protocol) {
	return RAW_FILE_RE.test(protocol);
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
	
	!file || typeof file != 'string' ? execCallback() : fs.stat(file, execCallback);
}

module.exports = function(req, res, next) {
	var options = req.options;
	var config = this.config;
	var protocol = options && options.protocol;
	if (!protoMgr.isFileProxy(protocol)) {
		return next();
	}
	var defaultType = mime.lookup(req.fullUrl.replace(/[?#].*$/, ''), 'text/html');
	var rule = req.rules.rule;
	if (rule.value) {
		var reader = {
				statusCode: 200,
				body: util.removeProtocol(rule.value, true),
				headers: {
				    	'content-type': (rule.key ? mime.lookup(rule.key, defaultType) : defaultType) + '; charset=utf-8'
				    }
		};
		
	    if (isTplProtocol(protocol)){
	    	reader.realUrl = rule.matcher;
	    	render(reader);
	    } else {
	    	reader = util.wrapResponse(reader);
	    	reader.realUrl = rule.matcher;
	    	res.response(reader);
	    }
		return;
	}
	
	readFiles(util.getRuleFiles(rule), function(err, path) {
		if (err) { 
	    	if (/^x/.test(protocol)) {
				  extend(options, url.parse(/^xs/.test(protocol) ? req.fullUrl.replace(/^http:/, 'https:') : req.fullUrl));
				  next();
			  } else {
				  var notFound = util.wrapResponse({
						statusCode: 404,
						body: 'Not found file <strong>' + path + '</strong>',
						headers: {
						    	'content-type': 'text/html; charset=utf-8'
						    }
				  });
				  notFound.realUrl = path;
				  res.response(notFound);
			  }
	    	return;
	    }
		
		var headers = {
	    		'server': config.name,
		    	'content-type': mime.lookup(path, defaultType) + '; charset=utf-8'
		    };
    	
	    if (isTplProtocol(protocol)) {
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
	
	function render(reader) {
		if (reader.body) {
			var data = querystring.parse(util.getQueryString(req.fullUrl));
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