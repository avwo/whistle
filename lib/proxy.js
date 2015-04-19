var util = require('../util');
var rules = require('./rules');
var fs = require('fs');
var http = require('http');
var https = require('https');
var url = require('url');
var extend = require('util')._extend;
var EventEmitter = require('events').EventEmitter;
var PassThrough = require('stream').PassThrough;
var config = require('../util').config;

function setWhistleHeaders(headers, req, isHttp, isHttps) {
	var options = req.options;
	var host = options.host ? options.host.split(':')[0] : '';
	options.host = host + (options.port ? ':' + options.port : '');
	
	headers['x-remote-ip'] = options.hosts[1] || '127.0.0.1';
	
	var matcher = options.rule && options.rule.matcher;
	if (matcher) {
		headers['x-' + config.name + '-rule'] = matcher;
	}
	
	if (req.headPath) {
		headers['x-' + config.name + '-head'] = req.headPath;
	}
	
	if (matcher || isHttps) {
		headers['x-remote-url'] = isHttp ? url.format(options) : options.url;
	}
}

function getOptions(fullUrl) {
	var options = url.parse(fullUrl);
	options.hosts = ['127.0.0.1', '127.0.0.1'];
	options.url = fullUrl;
	return options;
}

module.exports = function(req, res, next) {
	var self = this;
	var fullUrl = req.fullUrl = util.getFullUrl(req);
	var request = new EventEmitter();
	var response = new EventEmitter();
	var timeoutId, clientReq;
	var isResponded, aborted;
	
	function handleResolve(err, options) {
		req.options = options;
		res.__response = function(_res) {
			if (isResponded) {
				return;
			}
			
			var headers = _res.headers || {};
			var statusCode = _res.statusCode || 0;
			extend(headers, res.resHeaders);
			isResponded = true;
			
			setWhistleHeaders(headers, req, util.isWebProtocol(req.options.protocol), req.isHttps);
		};
		
		err ? req.emit('error', err) : next();
	}
	

	var headPath = rules.resolveHead(fullUrl);
	util.parseFileToJson(headPath, function(err, data) {
		if (data) {
			req.headPath = headPath;
			if (data.statusCode != null) {
				handleResolve(null, getOptions(fullUrl));
				res.response(util.wrapResponse(data));
				return;
			}
			
			res.resHeaders = data.res;
			extend(req.headers, data.req);
			
		} else if (headPath) {
			req.headPath = 'error(' + (err ? err.message : 'SyntaxError') + ')';
		}
		
		rules.resolve(fullUrl, handleResolve);
	});
	
};