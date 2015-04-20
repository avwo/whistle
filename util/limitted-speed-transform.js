var Transform = require('stream').Transform;
var util = require('util');

function LimitedSpeedTransform(speed) {
	if (!(this instanceof LimitedSpeedTransform)) {
		  return new LimitedSpeedTransform(speed);
	  }
	Transform.call(this);
	speed = parseInt(speed * 1000 / 8);
	if (speed > 0) {
		this._speed = speed;
	}
}

util.inherits(LimitedSpeedTransform, Transform);

LimitedSpeedTransform.prototype._transform = function(chunk, encoding, callback) {
	if (this._speed) {
		setTimeout(function() {
			callback(null, chunk);
		}, Math.round(chunk.length * 1000 / this._speed));
	} else {
		callback(null, chunk);
	}
};

module.exports = LimitedSpeedTransform;