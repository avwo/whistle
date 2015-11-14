var Transform = require('pipestream').Transform;
var util = require('util');

function ReplacePatternTransform(pattern, value) {
	if (!(this instanceof ReplacePatternTransform)) {
		  return new ReplacePatternTransform(options);
	  }
	
	Transform.call(this);
	
	this._pattern = pattern;
	this._value = value == null ? '' : value + '';
	this._length = this._value.length;
	this._minLength = this._length + 1024;
}

util.inherits(ReplacePatternTransform, Transform);

ReplacePatternTransform.prototype._transform = function(chunk, encoding, callback) {
	callback(null, chunk);
};

module.exports = ReplacePatternTransform;