var Transform = require('stream').Transform;
var util = require('util');

function _Transform(options) {
	
}

util.inherits(_Transform, Transform);

_Transform.prototype._transform = function(chunk, encoding, cb) {
	var rest = this._rest || '';
	if (chunk.length < 8) {
		cb(null);
		return;
	}
	
	
};

module.exports = _Transform;