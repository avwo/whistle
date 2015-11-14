var Transform = require('pipestream').Transform;
var util = require('util');

function ReplaceStringTransform(str, value) {
	if (!(this instanceof ReplaceStringTransform)) {
		  return new ReplaceStringTransform(options);
	  }
	
	Transform.call(this);
	this._pattern = pattern;
	this._value = value == null ? '' : value + '';
	this._length = this._value.length;
}

util.inherits(ReplaceStringTransform, Transform);

ReplaceStringTransform.prototype._transform = function(chunk, encoding, callback) {
	callback(null, chunk);
};

module.exports = ReplaceStringTransform;