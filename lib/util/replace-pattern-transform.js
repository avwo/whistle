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
	if (chunk) {
		chunk = this._rest + chunk;
		var len = chunk.length;
		var minIndex = len + 1 - LENGTH;
		var index = 0;
		var value = this._value;
		var result = chunk.replace(this._pattern, function() {
			var matcher = replace(arguments, value);
			var lastIndex = arguments.length - 1;
			index = arguments[lastIndex - 1] + arguments[lastIndex].length;
			return matcher;
		}); 
		index = Math.max(index, len + 1 - LENGTH);
		this._rest = chunk.substring(index);
		chunk = chunk.substring(0, index);
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
		return $1 == '\\' ? $2 : ($1 || '') + (args[$2].substring(1) || '');
	}) : '';
}

module.exports = ReplacePatternTransform;