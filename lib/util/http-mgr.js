var http = require('http');
var https = require('https');
var fs = require('fs');
var url = require('url');
var extend = require('extend');
var fileMgr = require('./file-mgr');
var logger = require('./logger');

var cache = {};
var listeners = [];
var newUrls;
var TIMEOUT = 10000;
var MAX_RULES_LEN = 1024 * 64;
var MAX_FILE_LEN = 1024 * 256;
var MAX_INTERVAL = 1000 * 30;
var MIN_INTERVAL = 1000 * 10;
var EEXCEED = 'EEXCEED';
var OPTIONS = { encoding: 'utf8' };
var queue = [];
var queueTimer;
var FILE_RE = /^(?:[a-z]:[\\/]|~?\/)/i;

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
    options = url.parse(fullUrl);
  } else {
    var fullUrl = options.url || options.uri;
    if (fullUrl && typeof fullUrl === 'string') {
      options = extend(options, url.parse(fullUrl));
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
      callback(err, body, res || '');
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
  var client = httpModule.request(options, function(r) {
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
  fs.stat(url, function(err, stat) {
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
    
    var stream = fs.createReadStream(fileMgr.convertSlash(url), OPTIONS);
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
      }, getInterval(consumeTime, data.isLocalUrl || data.isLocaPath));
      return;
    }
  }
}

function updateBody(url, callback, init) {
  var data = cache[url];
  if (!data) {
    return callback && callback();
  }
  if (data.isLocaPath) {
    return readFile(url, addQueue);
  }
  var now = Date.now();
  request({
    url: url,
    maxLength: MAX_RULES_LEN,
    ignoreExceedError: true
  }, function(err, body, res) {
    data = cache[url];
    callback && callback(url, Date.now() - now);
    if (!data) {
      return;
    }
    if (!err && res.statusCode !== 200) {
      err = new Error('Response ' + res.statusCode);
    }
    if (err) {
      logger.error(url, err.message);
      if (init) {
        updateBody(url);
        return;
      }
    }
    addQueue(url);
    if (err) {
      return;
    }
    triggerChange(data, body);
  });
  return true;
}

exports.addChangeListener = function(l) {
  listeners.push(l);
};

exports.add = function(url) {
  var data = cache[url];
  if (!data) {
    cache[url] = data = {
      body: '',
      isLocalUrl: url.indexOf('http://127.0.0.1:') === 0,
      isLocaPath: FILE_RE.test(url)
    };
    updateBody(url, null, true);
  }
  if (newUrls) {
    newUrls[url] = 1;
  }
  return data.body;
};

exports.clean = function() {
  if (!newUrls && Object.keys(cache).length) {
    triggerChange();
  }
};
