var dns = require('dns');
var noop = require('util').noop;

var dnsCache = {};
var callbacks = {};
var TIMEOUT = 5000;
var CACHE_TIME = 30000;

function lookupDNS(hostname, callback) {
  var list = callbacks[hostname];
  callback = callback || noop;
  if (list) {
    list.push(callback);
    return;
  }
  callbacks[hostname] = list = [callback];

  var done;
  function execCallback(err, ip) {
    if (!err) {
      dnsCache[hostname] = {
        ip: ip,
        hostname: hostname,
        time: Date.now()
      };
    }
    if (done) {
      return;
    }
    done = true;
    callbacks[hostname] = null;
    list.forEach(function(callback) {
      callback(err, ip);
    });
  }

  var timer = setTimeout(function() {
    execCallback(new Error('Timeout'));
  }, TIMEOUT);

  try {
    dns.lookup(hostname, function (err, ip, type) {
      clearTimeout(timer);
      if (err) {
        execCallback(err);
      } else {
        execCallback(null, ip || getDefaultIp(type));
      }
    });
  } catch(err) {//如果断网，可能直接抛异常，https代理没有用到error-handler
    execCallback(err);
  }
}

function getDefaultIp(type) {
  return !type || type == 4 ? '127.0.0.1' : '0:0:0:0:0:0:0:1';
}

module.exports = function lookup(hostname, callback, allowDnsCache) {
  var host = allowDnsCache ? dnsCache[hostname] : null;
  if (host) {
    callback(null, host.ip);
    if (Date.now() - host.time > CACHE_TIME) {
      lookupDNS(host.hostname);
    }
    return host.ip;
  }
  lookupDNS(hostname, function(err, ip) {
    err ? lookupDNS(hostname, callback) : callback(err, ip);
  });
};
