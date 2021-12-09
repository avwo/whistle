var dns = require('dns');
var net = require('net');
var request = require('../util/http-mgr').request;
var config = require('../config');

var dnsCacheTime = parseInt(config.dnsCache, 10);
var dnsServer = config.dnsServer;
var dnsOverHttps = config.dnsOverHttps;
var resolve6 = config.resolve6;
var dnsOptional = config.dnsOptional;
var dnsCache = {};
var callbacks = {};
var TIMEOUT = 10000;
var CACHE_TIME = dnsCacheTime >= 0 ? dnsCacheTime : 60000;
var MAX_CACHE_TIME = Math.max(CACHE_TIME * 3, 600000);

if (dnsOverHttps) {
  dnsOverHttps += (dnsOverHttps.indexOf('?') === -1 ? '?' : '&') + 'name=';
}

function getIpFromAnswer(data) {
  var index = data.length - 1;
  var ip = data[index] && data[index].data;
  if (net.isIP(ip)) {
    return ip;
  }
  while(index-- > 0) {
    ip = data[index] && data[index].data;
    if (net.isIP(ip)) {
      return ip;
    }
  }
}

function lookDnsOverHttps(hostname, callback) {
  request({
    url: dnsOverHttps + hostname,
    rejectUnauthorized: config.rejectUnauthorized
  }, function(err, data) {
    if (err) {
      return callback(err);
    }
    try {
      data = JSON.parse(data);
      data = data && data.Answer;
      return callback(null, data && getIpFromAnswer(data));
    } catch (e) {
      err = data || e;
    }
    return  callback(err || 'DNS Over HTTPS Look Failed.');
  });
}

function lookupDNS(hostname, callback) {
  if (net.isIP(hostname)) {
    return callback(null, hostname);
  }
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
  var timer;
  var optional = dnsOptional;
  var handleDns = function(fn) {
    timer = setTimeout(function() {
      execCallback(new Error('Timeout'));
    }, TIMEOUT);
    if (!fn) {
      if (dnsServer) {
        fn = resolve6 ? 'resolve6' : 'resolve4';
      } else {
        fn = 'lookup';
      }
    }
    try {
      (dnsOverHttps ? lookDnsOverHttps : dns[fn])(hostname, function (err, ip, type) {
        clearTimeout(timer);
        if (err) {
          execCallback(err);
        } else {
          ip = Array.isArray(ip) ? ip[0] : ip;
          if (!ip && optional) {
            execCallback(true);
          } else {
            execCallback(null, ip || getDefaultIp(type));
          }
        }
      });
    } catch(err) {//如果断网，可能直接抛异常，https代理没有用到error-handler
      execCallback(err);
    }
  };
  function execCallback(err, ip) {
    clearTimeout(timer);
    if (!err) {
      dnsCache[hostname] = {
        ip: ip,
        hostname: hostname,
        time: Date.now()
      };
    } else if (optional) {
      optional = false;
      return handleDns('lookup');
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
  handleDns();
}

function getDefaultIp(type) {
  return resolve6 || type == 6 ? '0:0:0:0:0:0:0:1' : '127.0.0.1';
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
