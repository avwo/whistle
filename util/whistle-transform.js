var Transform = require('pipestream').Transform;
var util = require('util');
var iconv = require('iconv-lite');

function WhistleTransform(options) {
	if (!(this instanceof WhistleTransform)) {
		  return new WhistleTransform(options);
	  }
	
	Transform.call(this);
	options = options || {};
	var value = parseInt(options.speed * 1000 / 8);
	if (value > 0) {
		this._speed = value;
	}
	if ((value = parseInt(options.delay)) > 0) {
		this._delay = value;
	}
	
	var charset = options.charset && String(options.charset);
	if (!iconv.encodingExists(charset)) {
		charset = 'utf8';
	}
	
	this._body = getBuffer(options, 'body', charset);
	this._top = getBuffer(options, 'top', charset);
	this._bottom = getBuffer(options, 'bottom', charset);
}

function getBuffer(options, name, charset) {
	name = options[name] && String(options[name]);
	return name ? iconv.encode(name, charset) : null;
}

util.inherits(WhistleTransform, Transform);

WhistleTransform.prototype._transform = function(chunk, encoding, callback) {
	var self = this;
	var end = !chunk;
	
	function cb() {
		self._inited = true;
		if (end && self._bottom) {
			chunk = chunk ? Buffer.concat([chunk, self._bottom]) : self._bottom;
		}
		if (self._speed) {
			setTimeout(function() {
				callback(null, chunk);
			}, Math.round(chunk.length * 1000 / self._speed));
		} else {
			callback(null, chunk);
		}
	}
	
	if (!self._inited) {
		if (self._body) {
			end = true;
			chunk = self._body;
		}
		if (self._top) {
			chunk = chunk ? Buffer.concat([self._top, chunk]) : self._top;
		}
		
		return self._delay ? cb() : setTimeout(cb, self._delay);
	}
	
	if (self._body) {
		chunk = null;
	}
	
	cb();
};

module.exports = WhistleTransform;