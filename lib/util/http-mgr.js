var http = require('http');
var https = require('https');
var url = require('url');
var extend = require('extend');
var Q = require('q');
var logger = require('./logger');

var events = {};
var MAX_LENGTH = 1024 * 256;
var TIMEOUT = 10000;
var INTERVAL = 1000 * 60 * 3;

function parseOptions(options) {
  var fullUrl = options.url || options.uri || options;
  if (typeof fullUrl === 'string') {
    options = extend(options, url.parse(fullUrl));
  }
  var maxLength = options.maxLength;
  if (!(maxLength > 0)) {
    options.maxLength = MAX_LENGTH;
  }
  options.agent = false;
  options.rejectUnauthorized = false;
  return options;
}

function request(options, callback) {
  options = parseOptions(options);
  var isHttps = options.protocol === 'https:';
  var httpModule = isHttps ? https : http;
  var fullUrl = 'http' + (isHttps ? 's' : '') + '://' + options.host + options.path;
  var done, timer, res;
  var body = '';
  var callbackHandler = function(err) {
    clearTimeout(timer);
    if (err) {
      err && client.abort();
      logger.warn(fullUrl, err.message);
    }
    if (!done) {
      done = true;
      callback(err, body, res);
    }
  };
  var addTimeout = function() {
    clearTimeout(timer);
    timer = setTimeout(function() {
      callbackHandler(new Error('Timeout'));
    }, TIMEOUT);
  };
  addTimeout();
  var maxLength = options.maxLength;
  var client = httpModule.get(options, function(r) {
    res = r;
    res.on('error', callbackHandler);
    res.setEncoding('utf8');
    res.on('data', function(data) {
      body += data;
      addTimeout();
      if (body.length > maxLength) {
        var err = new Error('The response body exceeded length limit');
        err.code = 'EEXCEED';
        callbackHandler(err);
      }
    });
    res.on('end', callbackHandler);
  });
  client.on('error', callbackHandler);
  client.end();
}

exports.request = request;

function updateRules(url) {
  var data = events[url];
  if (!data || data.promise) {
    return;
  }
  var defer = Q.defer();
  data.promise = defer;
  data = null;
  request(url, function(err, body, res) {
    data = events[url];
    if (!data) {
      return;
    }
    data.timer = setTimeout(updateRules, INTERVAL);
    body = body && body.trim();
    if (err || data.body === body) {
      return;
    }
    data.body = body;
    data.list.forEach(function(cb) {
      cb(body);
    });
  });
  return true;
}

exports.on = function(url, callback) {
  var data = events[url];
  if (data) {
    data.list.push(callback);
    if (data.body != null) {
      callback(data.body);
    }
    return;
  }
  events[url] = data = {};
  data.list = [callback];
  updateRules(url, data);
};

exports.off = function(url, callback) {
  var data = events[url];
  if (!data || !callback) {
    delete events[url];
    return;
  }
  var index = data.list.indexOf(callback);
  if (index === -1) {
    return;
  }
  data.list.splice(index, 1);
  if (!data.list.length) {
    clearTimeout(data.timer);
    delete events[url]; 
  }
};
