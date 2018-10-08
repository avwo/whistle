var http = require('http');
var https = require('https');
var url = require('url');
var extend = require('extend');
var logger = require('./logger');

var cache = {};
var listeners = [];
var TIMEOUT = 10000;
var INTERVAL = 1000 * 60 * 3;
var MAX_RULES_LEN = 1024 * 64;
var EEXCEED = 'EEXCEED';
var throttleTimer;

function triggerChange() {
  if (throttleTimer) {
    return;
  }
  throttleTimer = setTimeout(function() {
    listeners.forEach(function(l) {
      l();
    });
  }, 30000);
}

function parseOptions(options) {
  var fullUrl = options.url || options.uri || options;
  if (typeof fullUrl === 'string') {
    options = extend(options, url.parse(fullUrl));
  }
  var maxLength = options.maxLength;
  if (!(maxLength > 0)) {
    options.maxLength = 0;
  }
  options.agent = false;
  options.rejectUnauthorized = false;
  return options;
}

function request(options, callback) {
  options = parseOptions(options);
  var isHttps = options.protocol === 'https:';
  var httpModule = isHttps ? https : http;
  var done, timer, res;
  var body = '';
  var callbackHandler = function(err) {
    clearTimeout(timer);
    err && client.abort();
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
      if (maxLength && body.length > maxLength) {
        var err;
        if (!options.ignoreExceedError) {
          err = new Error('The response body exceeded length limit');
          err.code = EEXCEED;
        }
        callbackHandler(err);
      }
    });
    res.on('end', callbackHandler);
  });
  client.on('error', callbackHandler);
  client.end();
}

exports.request = request;

function updateBody(url, init) {
  var data = cache[url];
  request({
    url: url,
    maxLength: MAX_RULES_LEN,
    ignoreExceedError: true
  }, function(err, body, res) {
    data = cache[url];
    if (!data) {
      return;
    }
    err && logger.error(url, err.message);
    if (err && init) {
      updateBody(url);
      return;
    }
    data.timer = setTimeout(function() {
      updateBody(url);
    }, INTERVAL);
    body = body && body.trim();
    if (err || data.body === body) {
      return;
    }
    data.body = body;
    triggerChange();
  });
  return true;
}

exports.onDataChange = function(l) {
  listeners.push(l);
};

exports.add = function(url) {
  var data = cache[url];
  if (!data) {
    cache[url] = data = {body: ''};
    updateBody(url, true);
  }
  return data.body;
};
