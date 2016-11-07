var net = require('net');

function isPipeName(s) {
  return typeof s === 'string' && toNumber(s) === false;
}

function toNumber(x) { 
  return (x = Number(x)) >= 0 ? x : false; 
}

if (!net._normalizeConnectArgs) {
  //Returns an array [options] or [options, cb]
  //It is the same as the argument of Socket.prototype.connect().
  net._normalizeConnectArgs = function (args) {
    var options = {};
    
    if (args[0] !== null && typeof args[0] === 'object') {
      // connect(options, [cb])
      options = args[0];
    } else if (isPipeName(args[0])) {
      // connect(path, [cb]);
      options.path = args[0];
    } else {
      // connect(port, [host], [cb])
      options.port = args[0];
      if (typeof args[1] === 'string') {
        options.host = args[1];
      }
    }
   
    var cb = args[args.length - 1];
    return typeof cb === 'function' ? [options, cb] : [options];
  };
}

module.exports = function init(options, callback) {
	require('./lib/config').extend(options);
	return require('./lib')(callback);
};