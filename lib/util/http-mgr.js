var http = require('http');
var https = require('https');
var fs = require('fs');
var extend = require('extend');
var fileMgr = require('./file-mgr');
var logger = require('./logger');
var parseUrl = require('./parse-url');
var zlib = require('./zlib');

var cache = {};
var listeners = [];
var newUrls;
var TIMEOUT = 10000;
var MAX_RULES_LEN = 1024 * 64;
var MAX_FILE_LEN = 1024 * 256;
var MAX_INTERVAL = 1000 * 30;
var MIN_INTERVAL = 1000 * 10;
var EXCEED = 'EEXCEED';
var OPTIONS = { encoding: 'utf8' };
var queue = [];
var queueTimer;
var FILE_RE = /^(?:[a-z]:[\\/]|[~～]?\/)/i;
var GZIP_RE = /gzip/i;

function getInterval(time, isLocal) {
  var len = Object.keys(cache).length || 1;
  var interval = isLocal ? 5000 : Math.max(MIN_INTERVAL, Math.ceil(MAX_INTERVAL / len));
  var minTime = interval - (time > 0 ? time : 0);
  return Math.max(minTime, 1000);
}

function triggerChange(data, body) {
  if (data) {
    body = body && body.trim() || '';
    if (data.body === body) {
      return;
    }
    data.body = body;
  }
  if (newUrls) {
    return;
  }
  newUrls = {};
  listeners.forEach(function(l) {
    l();
  });
  Object.keys(newUrls).forEach(function(url) {
    newUrls[url] = cache[url];
  });
  cache = newUrls;
  newUrls = null;
}

function parseOptions(options) {
  if (typeof options === 'string') {
    options = parseUrl(fullUrl);
  } else {
    var fullUrl = options.url || options.uri;
    if (fullUrl && typeof fullUrl === 'string') {
      options = extend(options, parseUrl(fullUrl));
    }
  }
  var maxLength = options.maxLength;
  if (!(maxLength > 0)) {
    options.maxLength = 0;
  }
  options.agent = false;
  options.rejectUnauthorized = false;
  return options;
}

function toString(obj) {
  if (obj == null) {
    return;
  }
  if (typeof obj === 'object') {
    return JSON.stringify(obj);
  }
  if (Buffer.isBuffer(obj)) {
    return obj;
  }
  return obj + '';
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
      if (res && body && GZIP_RE.test(res.headers['content-encoding'])) {
        zlib.gunzip(body, function(err, result) {
          callback(err, err ? '' : result + '', res || '');
        });
      } else {
        callback(err, body + '', res || '');
      }
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
  options.agent = false;
  var client = httpModule.request(options, function(r) {
    res = r;
    res.on('error', callbackHandler);
    res.on('data', function(data) {
      body = body ? Buffer.concat([body, data]) : data;
      addTimeout();
      if (maxLength && body.length > maxLength) {
        var err;
        if (!options.ignoreExceedError) {
          err = new Error('The response body exceeded length limit');
          err.code = EXCEED;
        }
        callbackHandler(err);
      }
    });
    res.on('end', callbackHandler);
  });
  client.on('error', callbackHandler);
  client.end(toString(options.body));
  return client;
}

exports.request = request;

function readFile(url, callback) {
  var data;
  var now = Date.now();
  var execCallback = function() {
    callback(url, Date.now() - now);
  };
  var filePath = fileMgr.convertSlash(url);
  fs.stat(filePath, function(err, stat) {
    data = cache[url];
    if (!data) {
      return execCallback();
    }
    if (err) {
      if (err.code === 'ENOENT') {
        err = null;
      } else {
        logger.error(url, err.message);
      }
      triggerChange(data);
      data.mtime = null;
      return execCallback();
    }
    if (!stat.isFile()) {
      triggerChange(data);
      data.mtime = null;
      return execCallback();
    }
    var time = stat.mtime.getTime();
    if (time === data.mtime) {
      return execCallback();
    }
    
    var stream = fs.createReadStream(filePath, OPTIONS);
    var done;
    var body = '';
    var listener = function(err) {
      if (done) {
        return;
      }
      execCallback();
      if (err && err.code !== 'ENOENT') {
        return;
      }
      done = true;
      data.mtime = time;
      stream.close();
      triggerChange(data, body);
    };
    stream.on('data', function(text) {
      if (done) {
        return;
      }
      body += text;
      if (body.length > MAX_FILE_LEN) {
        listener();
      }
    });
    stream.on('error', listener);
    stream.on('end', listener);
  });
}

function addQueue(url, consumeTime) {
  if (cache[url] && queue.indexOf(url) === -1) {
    queue.push(url);
  }
  var data;
  while(!queueTimer && !data) {
    url = queue.shift();
    if (!url) {
      return;
    }
    data = cache[url];
    if (data) {
      queueTimer = setTimeout(function() {
        queueTimer = null;
        updateBody(url, addQueue);
      }, getInterval(consumeTime, data.isLocalUrl || data.isLocalPath));
      return;
    }
  }
}

function updateBody(url, callback, init) {
  var data = cache[url];
  if (!data) {
    return callback && callback();
  }
  if (data.isLocalPath) {
    return readFile(url, addQueue);
  }
  var now = Date.now();
  var options = {
    url: url,
    maxLength: MAX_RULES_LEN,
    ignoreExceedError: true
  };
  if (data.headers) {
    options.headers = data.headers;
  }
  request(options, function(err, body, res) {
    data = cache[url];
    callback && callback(url, Date.now() - now);
    if (!data) {
      return;
    }
    var code = res.statusCode;
    var notFound = err ? (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') : (code != 200 && code != 204);
    err && logger.error('[Load Rules]', url, err.message || err);
    if (notFound) {
      data._retry = data._retry || 0;
      if (data._retry > 2) {
        !err && logger.warn('[Load Rules]', url, 'status', code);
        data._retry = -6;
        err = body = '';
        notFound = false;
      }
      ++data._retry;
    } else {
      data._retry = 0;
    }
    if (notFound || err) {
      if (init) {
        updateBody(url);
        return;
      }
    }
    addQueue(url);
    if (notFound || err) {
      return;
    }
    triggerChange(data, body);
  });
  return true;
}

exports.addChangeListener = function(l) {
  listeners.push(l);
};

exports.add = function(url, headers) {
  var data = cache[url];
  if (!data) {
    cache[url] = data = {
      body: '',
      isLocalUrl: url.indexOf('http://127.0.0.1:') === 0,
      isLocalPath: FILE_RE.test(url),
      headers: headers
    };
    updateBody(url, null, true);
  }
  if (newUrls) {
    newUrls[url] = 1;
  }
  return data.body;
};

exports.forceUpdate = function(root) {
  Object.keys(cache).forEach(function(url) {
    if (url.indexOf(root) === 0) {
      updateBody(url);
    }
  });
};

exports.clean = function() {
  if (!newUrls && Object.keys(cache).length) {
    triggerChange();
  }
};
