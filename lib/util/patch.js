var EventEmitter = require('events').EventEmitter;
var Socket = require('net').Socket;
var res = require('http').OutgoingMessage.prototype;

process.emitWarning = function() {};

var setHeader = res.setHeader;
res.setHeader = function(field, val){
  try {
    return setHeader.call(this, field, val);
  } catch(e) {}
};

function listenerCount(emitter, eventName) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(eventName);
  }
  return EventEmitter.listenerCount(emitter, eventName);
}

exports.listenerCount = listenerCount;

var noop = function() {};
var proto = Socket.prototype;
var destroy = proto.destroy;
var on = proto.on;
// 避免第三方模块没处理好异常导致程序crash
proto.destroy = function(err) {
  if (err && !listenerCount(this, 'error')) {
    this.on('error', noop);
  }
  return destroy.call(this, err);
};
// 避免一些奇奇怪怪的异常，导致整个进程 crash
// 如：Error: This socket has been ended by the other party
var wrapOn = function() {
  var evt = arguments[0];
  if (this.on === wrapOn) {
    this.on = on;
  }
  if (evt !== 'error' && !listenerCount(this, 'error')) {
    on.call(this, 'error', noop);
  }
  return on.apply(this, arguments);
};
proto.on = wrapOn;
