var common = require('../util/common');
var request = require('../util/http-mgr').request;
var util = require('./util');
var extend = require('extend');

var requestData;
var BASE_URL = 'https://' + common.SERVICE_HOST;
var TEMP_FILE_RE = /\b[\da-f]{64}\b/g;
var MAX_COUNT = 100;
var tempFiles = [];
var config;
var savedDir;
var savedTimer;
var curWhistleId;
var historyList;

var getQueryString = function(data) {
  return '?type=' + encodeURIComponent(data.type) + (data.filename ? '&filename=' + encodeURIComponent(data.filename) : '');
};

var getReqOptions = function(data, url) {
  var body = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
  var len = body.length;
  return len > 2 && {
    method: 'POST',
    url: (url || '/service/cgi/save') + getQueryString(data),
    strictMode: true,
    headers: {
      'content-type': 'application/octet-stream',
      'content-length': len
    },
    body: body
  };
};

var saveToService = function(data) {
  if (!data.data) {
    return;
  }
  requestData(getReqOptions(data));
};

var shareData = function(data, cb) {
  if (!data.data) {
    return;
  }
  requestData(getReqOptions(data, '/service/cgi/share'), cb);
};

var parseTempFiles = function(rules) {
  if (!Array.isArray(rules)) {
    return;
  }
  var isChanged = false;
  var list = rules.map(function(rule) {
    return rule && rule.value || '';
  }).join('\n').match(TEMP_FILE_RE);
  list && list.forEach(function(file) {
    if (tempFiles.indexOf(file) === -1) {
      isChanged = true;
      tempFiles.push(file);
    }
  });
  if (isChanged) {
    saveTempFiles();
  }
};

var saveComposeData = function(data) {
  historyList = data || historyList;
  if (!config.whistleToken || !Array.isArray(historyList)) {
    return;
  }
  historyList.map(function(item) {
    var newItem = extend({}, item);
    var rawData = item.headers + '\r\n\r\n' + (item.base64 || item.body || '');
    if (!item.dataHash && !item.base64Hash) {
      item[item.base64 ? 'base64Hash' : 'dataHash'] = util.getHexHash(rawData);
    }
    delete newItem.headers;
    delete newItem.body;
    delete newItem.base64;
    return newItem;
  });
};

var descSorter = function(a, b) {
  var flag = b.time - a.time;
  if (flag === 0) {
    return 0;
  }
  return flag > 0 ? 1 : -1;
};

var removeSavedData = function(filename) {
  if (!filename || !config.whistleToken) {
    return;
  }
};

var saveSavedData = function(filename, buffer) {
  clearTimeout(savedTimer);
  if (!config.whistleId) {
    return;
  }
  util.getSavedList(savedDir, function(err, list) {
    if (err) {
      savedTimer = setTimeout(saveSavedData, 1000);
      return;
    }
    list = list.sort(descSorter).slice(0, MAX_COUNT);
  });
};

var saveTempFiles = function() {
  if (!tempFiles.length) {
    return;
  }
};

var saveData = function(data) {
  if (!config.whistleToken) {
    return;
  }
  // Initialize curWhistleId on first save
  if (!curWhistleId) {
    curWhistleId = data.whistleId;
    saveComposeData();
    saveSavedData();
  }
  if (data.type === 'data') {
    parseTempFiles(data.rules);
    saveToService({
      type: 'certs',
      data: data.certs
    });
    saveToService({
      type: 'rules',
      data: data.rules
    });
    saveToService({
      type: 'values',
      data: data.values
    });
    saveToService({
      type: 'plugins',
      data: data.plugins
    });
  } else if (data.type === 'settings') {
    saveToService({
      type: 'networkSettings',
      data: data.networkSettings
    });
    saveToService({
      type: 'rulesSettings',
      data: data.rulesSettings
    });
    saveToService({
      type: 'valuesSettings',
      data: data.valuesSettings
    });
  } else if (data.type === 'composer') {
    saveComposeData(data.history);
  } else if (data.type === 'savedData') {
    saveSavedData(data.filename, data.buffer);
  }
};

exports.saveData = saveData;
exports.shareData = shareData;

exports.removeSavedData = removeSavedData;
exports.saveComposeData = saveComposeData;

exports.forwardRequest = function(req, res) {
  var index = req.url && req.url.indexOf('?');
  var url = req.path + (index > -1 ? req.url.substring(index) : '');
  requestData({
    method: req.method,
    url: url,
    body: req,
    responseType: 'stream'
  }, function(err, svRes) {
    if (err) {
      return common.sendRes(res, 500, (err && err.message) || 'Internal Server Error');
    }
    res.writeHead(svRes.statusCode, svRes.headers);
    svRes.pipe(res);
  });
};

exports.requestData = function(opts, cb) {
  return requestData(opts, cb);
};

exports.setup = function(options) {
  config = options;
  savedDir = config.SAVED_SESSIONS_PATH;
  requestData = function(opts, cb) {
    if (!opts) {
      return cb && cb(new Error('Bad request'));
    }
    if (typeof opts === 'string') {
      opts = { url: opts };
    } else {
      opts.pluginName = null;
    }
    opts.responseType = opts.responseType || 'json';
    opts.url = BASE_URL + (opts.url[0] === '/' ? '' : '/') + opts.url;
    return request(common.setInternalOptions(opts, {
      PROXY_ID_HEADER: config.PROXY_ID_HEADER,
      host: config.host,
      port: config.port
    }, true), cb || common.noop);
  };
  saveSavedData();
};
