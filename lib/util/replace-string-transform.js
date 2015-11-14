var Transform = require('pipestream').Transform;
var util = require('util');

function ReplaceStringTransform(str, value) {
	if (!(this instanceof ReplaceStringTransform)) {
		  return new ReplaceStringTransform(options);
	  }
	
	Transform.call(this);
	this._str = str;
	this._length = this._str.length;
	this._value = value == null ? '' : value + '';
	this._rest = '';
}

util.inherits(ReplaceStringTransform, Transform);

var proto = ReplaceStringTransform.prototype;
proto._transform = function(chunk, encoding, callback) {
	if (chunk) {
		chunk = this._rest + chunk;
		var len = chunk.length;
		var minIndex = len + 1 - this._length;
		var index = chunk.lastIndexOf(this._str);
		
		if (index != -1) {
			index = Math.max(minIndex, index + this._length);
		} else {
			index = minIndex;
		}
		this._rest = chunk.substring(index);
		chunk = chunk.substring(0, index);
	} else {
		chunk = this._rest;
	}
	
	if (chunk) {
		chunk = chunk.split(this._str).join(this._value);
	}
	
	callback(null, chunk);
};

module.exports = ReplaceStringTransform;