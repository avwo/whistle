var Transform = require('pipestream').Transform;
var util = require('util');

function ReplaceTransform(str, value) {
	if (!(this instanceof ReplaceTransform)) {
		  return new ReplaceTransform(options);
	  }
	
	Transform.call(this);
	
}

util.inherits(ReplaceTransform, Transform);

ReplaceTransform.prototype._transform = function(chunk, encoding, callback) {
	callback(null, chunk);
};

module.exports = ReplaceTransform;