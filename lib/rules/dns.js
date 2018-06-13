var dns = require('dns');
var dnsCacheTime = parseInt(require('../config').dnsCache, 10);

var dnsCache = {};
var callbacks = {};
var TIMEOUT = 5000;
var CACHE_TIME = dnsCacheTime >= 0 ? dnsCacheTime : 60000;
var MAX_CACHE_TIME = Math.max(CACHE_TIME * 3, 600000);

function lookupDNS(hostname, callback) {
  var list = callbacks[hostname];
  if (list) {
    if (callback) {
      list.push(callback);
    }
    return;
  }
  callbacks[hostname] = list = [];
  if (callback) {
    list.push(callback);
  }
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
    var host = dnsCache[hostname];
    callbacks[hostname] = null;
    list.forEach(function(callback) {
      callback(err, host && host.ip);
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
  var cacheTime;
  if (host) {
    cacheTime = Date.now() - host.time;
  }
  if (host && cacheTime < MAX_CACHE_TIME) {
    callback(null, host.ip);
    if (cacheTime > CACHE_TIME) {
      lookupDNS(host.hostname);
    }
    return host.ip;
  }
  lookupDNS(hostname, function(err, ip) {
    err ? lookupDNS(hostname, callback) : callback(err, ip);
  });
};
