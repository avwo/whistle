var Transform = require('pipestream').Transform;
var inherits = require('util').inherits;
var setDelayTimer = require('./common').setDelayTimer;

function SpeedTransform(options, req) {
  Transform.call(this);
  options = options || {};
  this._req = req;
  var value = parseInt((options.speed * 1000) / 8, 10);
  if (value > 0) {
    this._speed = value;
  }
  if ((value = parseInt(options.delay, 10)) > 0) {
    this._delay = value;
  }
}

inherits(SpeedTransform, Transform);

var proto = SpeedTransform.prototype;

proto._setTimeout = function (callback, delay) {
  var timer = setTimeout(callback, delay);
  if (this._req) {
    setDelayTimer(this._req, timer);
  }
};

proto._transform = function (chunk, encoding, callback) {
  var self = this;
  var cb = function () {
    if (chunk && self._speed) {
      self._setTimeout(function () {
        callback(null, chunk);
      }, Math.round((chunk.length * 1000) / self._speed));
    } else {
      callback(null, chunk);
    }
  };

  if (self._delay) {
    var delay = self._delay;
    self._delay = null;
    return self._setTimeout(cb, delay);
  }

  cb();
};

module.exports = SpeedTransform;
