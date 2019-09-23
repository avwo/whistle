var EventEmitter = require('events').EventEmitter;
var Socket = require('net').Socket;

function listenerCount(emitter, eventName) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(eventName);
  }
  return EventEmitter.listenerCount(emitter, eventName);
}

exports.listenerCount = listenerCount;

var noop = function() {};
var destroy = Socket.prototype.destroy;
// 避免第三方模块没处理好异常导致程序crash
Socket.prototype.destroy = function(err) {
  if (err && !listenerCount(this, 'error')) {
    this.on('error', noop);
  }
  destroy.call(this, err);
};
