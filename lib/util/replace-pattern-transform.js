var Transform = require('pipestream').Transform;
var util = require('util');
var LENGTH = 3072;

function ReplacePatternTransform(pattern, value) {
	if (!(this instanceof ReplacePatternTransform)) {
		  return new ReplacePatternTransform(options);
	  }
	
	Transform.call(this);
	
	this._pattern = pattern;
	this._value = value == null ? '' : value + '';
	this._rest = '';
}

util.inherits(ReplacePatternTransform, Transform);

var proto = ReplacePatternTransform.prototype;
proto._transform = function(chunk, encoding, callback) {
	if (chunk != null) {
		chunk = this._rest + chunk;
		var index = 0;
		var value = this._value;
		var result = chunk.replace(this._pattern, function() {
			var matcher = replace(arguments, value);
			var lastIndex = arguments.length - 1;
			index = arguments[lastIndex - 1] + arguments[lastIndex].length;
			return matcher;
		}); 
		index = Math.max(index, chunk.length + 1 - LENGTH);
		this._rest = chunk.substring(index);
		chunk = result.substring(0, result.length - this._rest.length);
	} else if (this._rest) {
		chunk = this._rest.replace(this._pattern, function() {
			return replace(arguments, this._value);
		}); 
	}
	
	callback(null, chunk);
};

function replace(args, replacement) {
	return replacement ? replacement.replace(/(^|.)?(\$[1-9])/g, 
			function(matched, $1, $2) {
		return $1 == '\\' ? $2 : ($1 || '') + (args[$2.substring(1)] || '');
	}) : '';
}

module.exports = ReplacePatternTransform;