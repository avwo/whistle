var Transform = require('pipestream').Transform;
var util = require('util');

function SpeedTransform(options) {
  Transform.call(this);
  options = options || {};
  var value = parseInt(options.speed * 1000 / 8);
  if (value > 0) {
    this._speed = value;
  }
  if ((value = parseInt(options.delay)) > 0) {
    this._delay = value;
  }
}

util.inherits(SpeedTransform, Transform);

SpeedTransform.prototype._transform = function(chunk, encoding, callback) {
  var self = this;
  var cb = function() {
    if (chunk && self._speed) {
      setTimeout(function() {
        callback(null, chunk);
      }, Math.round(chunk.length * 1000 / self._speed));
    } else {
      callback(null, chunk);
    }
  };

  if (self._delay) {
    var delay = self._delay;
    self._delay = null;
    return setTimeout(cb, delay);
  }

  cb();
};

module.exports = SpeedTransform;
