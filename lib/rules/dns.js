var dns = require('dns');
var net = require('net');
var config = require('../config');

var dnsCacheTime = parseInt(config.dnsCache, 10);
var dnsServer = config.dnsServer;
var resolve6 = config.resolve6;
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
    delete callbacks[hostname];
    list.forEach(function(callback) {
      callback(err, host && host.ip);
    });
  }

  if (net.isIP(hostname)) {
    return execCallback(null, hostname);
  }

  var timer = setTimeout(function() {
    execCallback(new Error('Timeout'));
  }, TIMEOUT);

  try {
    var fn = 'lookup';
    if (dnsServer) {
      fn = resolve6 ? 'resolve6' : 'resolve4';
    }
    dns[fn](hostname, function (err, ip, type) {
      clearTimeout(timer);
      if (err) {
        execCallback(err);
      } else {
        execCallback(null, (Array.isArray(ip) ? ip[0] : ip) || getDefaultIp(type));
      }
    });
  } catch(err) {//如果断网，可能直接抛异常，https代理没有用到error-handler
    execCallback(err);
  }
}

function getDefaultIp(type) {
  return !resolve6 && (!type || type == 4) ? '127.0.0.1' : '0:0:0:0:0:0:0:1';
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
