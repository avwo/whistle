var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();
emitter.setMaxListeners(1000000);

module.exports = emitter;
