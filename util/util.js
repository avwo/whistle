var net = require('net');
var url = require('url');
var path = require('path');
var os = require('os');

var REG_EXP_RE = /^\/(.+)\/(i)?$/

exports.isRegExp = function isRegExp(regExp) {
	return REG_EXP_RE.test(regExp);
};


exports.getHost = function parseHost(_url) {
	_url = url.parse(setProtocol(_url || '')).hostname;
	return _url && _url.toLowerCase();
};


exports.toRegExp = function toRegExp(regExp) {
	regExp = REG_EXP_RE.test(regExp);
	try {
		regExp = regExp && new RegExp(RegExp.$1, RegExp.$2);
	} catch(e) {
		regExp = null;
	}
	return regExp;
};

exports.getFullUrl = function getFullUrl(req) {
	return /^http:/.test(req.url) ? req.url : 'http://' + req.headers.host + req.url;
};

function setProtocol(url, isHttps) {
	return hasProtocol(url) ? url : 'http' + (isHttps ? 's' : '') + '://' + url;
}

function hasProtocol(url) {
	return /^[\w-]+:\/\//.test(url);
}

exports.hasProtocol = hasProtocol;
exports.setProtocol = setProtocol;

exports.isLocalAddress = function(address) {
	if (!address) {
		return false;
	}
	
	if (address == '127.0.0.1' || address == '0:0:0:0:0:0:0:1') {
		return true;
	}
	
	address = address.toLowerCase();
	var interfaces = os.networkInterfaces();
	for (var i in interfaces) {
		var list = interfaces[i];
		if (Array.isArray(list)) {
			for (var j = 0, info; info = list[j]; j++) {
				if (info.address.toLowerCase() == address) {
					return true;
				}
			}
		}
	}
	
	return false;
};

exports.isWebProtocol = function isWebProtocol(protocol) {
	return protocol == 'http:' || protocol == 'https:';
};


function noop() {}

exports.noop = noop;

exports.drain = function drain(stream, end) {
	if (end) {
		stream.endEmitted ? end.call(stream) : stream.on('end', end);
	}
	stream.on('data', noop);
};

exports.encodeNonAsciiChar = function encodeNonAsciiChar(str) {
	
	return  str ? str.replace(/[^\x00-\x7F]/g, encodeURIComponent) : str;
};
