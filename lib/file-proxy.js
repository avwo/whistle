var fs = require('fs');
var util = require('util');
var commonUtil = require('../util/util');
var url = require('url');
var mime = require('mime');
var config = require('../package.json');
var hosts = require('../data/hosts');

module.exports = function(req, res, next) {
	var protocol = req.options && req.options.protocol;
	if (protocol != 'file:' && protocol != 'xfile:' && protocol != 'xsfile:') {
		next();
		return;
	}
	var options = req.options;
	var path = options.url.substring(options.protocol.length + 2).replace(/\/?(?:\?|#).*$/, '');
	fs.stat(path, function(err, stat){
	    if(err || !stat.isFile()) { 
	    	var xsfile = protocol == 'xsfile:';
	    	if (xsfile || protocol == 'xfile:') {
				  util._extend(req.options, url.parse(req.fullUrl));
				  if (xsfile) {
					  req.options.protocol = 'https:';
				  }
				 
				  hosts.resolveHost(req.options.hostname, function(err, ip) {
					  req.options.hosts[1] = ip;
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
			    	'Content-Length': stat.size,
			    	'Content-Type': mime.lookup(path) + '; charset=utf-8',
			    	'Server': config.name
			    };
		    res.response(reader);
	    });
	    
	});
};