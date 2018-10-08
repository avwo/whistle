var http = require('http');
var https = require('https');
var url = require('url');
var LRU = require('lru-cache');
var extend = require('extend');

var cache = new LRU({ max: 36 });
var MAX_LENGTH = 1024 * 256;
var TIMEOUT = 10000;

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
  var httpModule = options.protocol === 'https:' ? https : http;
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

exports.on = function(url, callback) {

};

exports.off = function(url, callback) {

};
