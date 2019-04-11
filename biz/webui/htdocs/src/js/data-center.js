var $ = require('jquery');
var createCgi = require('./cgi');
var util = require('./util');
var NetworkModal = require('./network-modal');
var storage = require('./storage');
var events = require('./events');

var MAX_INCLUDE_LEN = 5120;
var MAX_EXCLUDE_LEN = 5120;
var MAX_FRAMES_LENGTH = exports.MAX_FRAMES_LENGTH = 80;
var MAX_COUNT = NetworkModal.MAX_COUNT;
var TIMEOUT = 20000;
var dataCallbacks = [];
var serverInfoCallbacks = [];
var framesUpdateCallbacks = [];
var logCallbacks = [];
var directCallbacks = [];
var dataList = [];
var logList = [];
var svrLogList = [];
var networkModal = new NetworkModal(dataList);
var curServerInfo;
var initialDataPromise, initialData, startedLoad;
var lastPageLogTime = -2;
var lastSvrLogTime = -2;
var dataIndex = 10000;
var MAX_PATH_LENGTH = 1024;
var lastRowId;
var endId;
var hashFilterObj;
var clearNetwork;
var inited;
var logId;
var uploadFiles;
var dumpCount = 0;
var onlyViewOwnData = storage.get('onlyViewOwnData') == 1;
var DEFAULT_CONF = {
  timeout: TIMEOUT,
  xhrFields: {
    withCredentials: true
  },
  data: {}
};
var whistlePort = /_whistleuipath_=(\d+)/.test(document.cookie);
if (whistlePort) {
  whistlePort = RegExp.$1;
  if (!(whistlePort > 0 && whistlePort <= 65535)) {
    whistlePort = null;
  }
}
var BASE_URI = whistlePort ? '...whistle-path.5b6af7b9884e1165...///cgi.' + whistlePort + '/' : '';
exports.clientIp = '127.0.0.1';
exports.MAX_INCLUDE_LEN = MAX_INCLUDE_LEN;
exports.MAX_EXCLUDE_LEN = MAX_EXCLUDE_LEN;
exports.changeLogId = function(id) {
  logId = id;
};

exports.getUploadFiles = function() {
  return uploadFiles;
};

exports.setDumpCount = function(count) {
  dumpCount = count > 0 ? count : 0;
};

exports.setOnlyViewOwnData = function(enable) {
  onlyViewOwnData = enable !== false;
  storage.set('onlyViewOwnData', onlyViewOwnData ? 1 : 0);
};
exports.isOnlyViewOwnData = function() {
  return onlyViewOwnData;
};

exports.filterIsEnabled = function() {
  if (onlyViewOwnData) {
    return true;
  }
  var settings = getFilterText();
  if (!settings || (settings.disabledFilterText && settings.disabledExcludeText)) {
    return;
  }
  var text = !settings.disabledFilterText && settings.filterText.trim();
  return text || (!settings.disabledExcludeText && settings.excludeText.trim());
};

function compareFilter(filter) {
  if (filter !== hashFilterObj) {
    return false;
  }
  if (!filter) {
    return true;
  }
  if (filter.url !== hashFilterObj.url || filter.ip !== hashFilterObj.ip) {
    return false;
  }
  return filter.name === hashFilterObj.name && filter.value === hashFilterObj.value;
}

function handleHashFilterChanged(e) {
  var hash = location.hash.substring(1);
  var index = hash.indexOf('?');
  var filter;
  if (index !== -1) {
    var obj = util.parseQueryString(hash.substring(index + 1), null, null, decodeURIComponent);
    exports.activeRulesName = obj.rulesName || obj.ruleName;
    exports.activeValuesName = obj.valuesName || obj.valueName;
    if (obj.url) {
      filter = {};
      filter.url = obj.url;
    }
    if (obj.name && obj.value) {
      filter = filter || {};
      filter.name = obj.name;
      filter.value = obj.value;
    }
    if (obj.ip) {
      filter = filter || {};
      filter.ip = obj.ip;
    }
    if (!inited && obj.clearNetwork === 'true') {
      clearNetwork = true;
    }
  }
  exports.hashFilterObj = filter;
  if (e && !compareFilter(filter)) {
    events.trigger('hashFilterChange');
  }
  hashFilterObj = filter;
}
handleHashFilterChanged();
$(window).on('hashchange', handleHashFilterChanged);

function setFilterText(settings) {
  settings = settings || {};
  storage.set('filterText', JSON.stringify({
    disabledFilterText: settings.disabledFilterText,
    filterText: settings.filterText,
    disabledExcludeText: settings.disabledExcludeText,
    excludeText: settings.excludeText
  }));
}
exports.setFilterText = setFilterText;

function getFilterText() {
  var settings = util.parseJSON(storage.get('filterText'));
  return settings ? {
    disabledFilterText: settings.disabledFilterText,
    filterText: util.toString(settings.filterText).substring(0, MAX_INCLUDE_LEN),
    disabledExcludeText: settings.disabledExcludeText,
    excludeText: util.toString(settings.excludeText).substring(0, MAX_EXCLUDE_LEN)
  } : {
    filterText: '',
    excludeText: ''
  };
}
exports.getFilterText = getFilterText;

function setNetworkColumns(settings) {
  settings = settings || {};
  storage.set('networkColumns', JSON.stringify({
    disabledColumns: settings.disabledColumns,
    columns: settings.columns
  }));
}

exports.setNetworkColumns = setNetworkColumns;

function getNetworkColumns() {
  return util.parseJSON(storage.get('networkColumns')) || {};
}

exports.getNetworkColumns = getNetworkColumns;

var FILTER_TYPES_RE = /^(m|i|h|b|c|d|H):/;
var FILTER_TYPES = {
  m: 'method',
  i: 'ip',
  h: 'headers',
  b: 'body',
  c: 'body',
  d: 'host',
  H: 'host'
};
var filterCache = [];

function getFilterCache(text) {
  var len = filterCache.length;
  var result = len ? util.findArray(filterCache, function(item) {
    return item.text === text;
  }) : null;
  len -= 10;
  if (len > 2) {
    filterCache = filterCache.slice(len);
    if (result && filterCache.indexOf(result) === -1) {
      filterCache.push(result);
    }
  }
  return result && result.filter;
}

function resolveFilterText(text) {
  text = text && text.trim();
  if (!text) {
    return;
  }
  var result = getFilterCache(text);
  if (result) {
    return result;
  }
  var pattern;
  text.split(/\s+/).forEach(function(line) {
    if (FILTER_TYPES_RE.test(line)) {
      var type = FILTER_TYPES[RegExp.$1];
      var not = line[2] === '!';
      line = line.substring(not ? 3 : 2);
      if (line) {
        result = result || [];
        pattern = util.toRegExp(line);
        result.push({
          type: type,
          not: not,
          pattern: pattern,
          keyword: pattern ? null : line.toLowerCase()
        });
      }
    } else if (line) {
      result = result || [];
      pattern = util.toRegExp(line);
      result.push({
        pattern: pattern,
        keyword: pattern ? null : line.toLowerCase()
      });
    }
  });
  if (result) {
    filterCache.push({
      text: text,
      filter: result
    });
  }
  return result;
}

function checkFilterField(str, filter, needDecode) {
  if (!str) {
    return false;
  }
  var result;
  if (filter.pattern) {
    result = filter.pattern.test(str);
  } else {
    if (needDecode) {
      try {
        var text = decodeURIComponent(str);
        if (text !== str) {
          str += '\n' + text;
        }
      } catch(e) {}
    }
    result = toLowerCase(str).indexOf(filter.keyword) !== -1;
  }
  return filter.not ? !result : result;
}

function checkFilter(item, list) {
  for (var i = 0, len = list.length; i < len; i++) {
    var filter = list[i];
    switch (filter.type) {
    case 'method':
      if (checkFilterField(item.method, filter)) {
        return true;
      }
      break;
    case 'ip':
      if (checkFilterField(item.req.ip || '127.0.0.1', filter)) {
        return true;
      }
      break;
    case 'headers':
      if (checkFilterField(util.objectToString(item.req.headers), filter, true)) {
        return true;
      }
      break;
    case 'host':
      if (checkFilterField(item.isHttps ? item.path : util.getHost(item.url), filter)) {
        return true;
      }
      break;
    case 'body':
      if (checkFilterField(util.getBody(item.req, true), filter)) {
        return true;
      }
      break;
    default:
      if (checkFilterField(item.url, filter)) {
        return true;
      }
    }
  }
  return false;
}

var POST_CONF = $.extend({
  type: 'post'
}, DEFAULT_CONF);
var GET_CONF = $.extend({
  cache: false
}, DEFAULT_CONF);
var cgi = createCgi({
  getData: BASE_URI + 'cgi-bin/get-data',
  getInitaial: BASE_URI + 'cgi-bin/init'
}, GET_CONF);

function toLowerCase(str) {
  return String(str == null ? '' : str).trim().toLowerCase();
}

exports.values = createCgi({
  moveTo: {
    mode: 'chain',
    url: BASE_URI + 'cgi-bin/values/move-to'
  },
  list: {
    type: 'get',
    url: BASE_URI + 'cgi-bin/values/list'
  },
  add: BASE_URI + 'cgi-bin/values/add',
  remove: BASE_URI + 'cgi-bin/values/remove',
  rename: BASE_URI + 'cgi-bin/values/rename',
  upload: BASE_URI + 'cgi-bin/values/upload',
  checkFile: BASE_URI + 'cgi-bin/values/check-file',
  removeFile: BASE_URI + 'cgi-bin/values/remove-file'
}, POST_CONF);

exports.plugins = createCgi({
  disablePlugin: BASE_URI + 'cgi-bin/plugins/disable-plugin',
  disableAllPlugins: BASE_URI + 'cgi-bin/plugins/disable-all-plugins',
  getPlugins: {
    type: 'get',
    url: BASE_URI + 'cgi-bin/plugins/get-plugins'
  }
}, POST_CONF);

exports.rules = createCgi({
  disableAllRules: BASE_URI + 'cgi-bin/rules/disable-all-rules',
  moveTo: {
    mode: 'chain',
    url: BASE_URI + 'cgi-bin/rules/move-to'
  },
  list: {
    type: 'get',
    url: BASE_URI + 'cgi-bin/rules/list'
  },
  add: BASE_URI + 'cgi-bin/rules/add',
  disableDefault: BASE_URI + 'cgi-bin/rules/disable-default',
  enableDefault: BASE_URI + 'cgi-bin/rules/enable-default',
  remove: BASE_URI + 'cgi-bin/rules/remove',
  rename: BASE_URI + 'cgi-bin/rules/rename',
  select: BASE_URI + 'cgi-bin/rules/select',
  unselect: BASE_URI + 'cgi-bin/rules/unselect',
  allowMultipleChoice: {
    mode: 'ignore',
    url: BASE_URI + 'cgi-bin/rules/allow-multiple-choice'
  },
  enableBackRulesFirst: {
    mode: 'ignore',
    url: BASE_URI + 'cgi-bin/rules/enable-back-rules-first'
  },
  syncWithSysHosts: BASE_URI + 'cgi-bin/rules/sync-with-sys-hosts',
  setSysHosts: BASE_URI + 'cgi-bin/rules/set-sys-hosts',
  getSysHosts: BASE_URI + 'cgi-bin/rules/get-sys-hosts'
}, POST_CONF);

exports.log = createCgi({
  set: BASE_URI + 'cgi-bin/log/set'
}, POST_CONF);

$.extend(exports, createCgi({
  composer: BASE_URI + 'cgi-bin/composer',
  interceptHttpsConnects: BASE_URI + 'cgi-bin/intercept-https-connects',
  abort: BASE_URI + 'cgi-bin/abort'
}, POST_CONF));
$.extend(exports, createCgi({
  donotShowAgain: BASE_URI + 'cgi-bin/do-not-show-again',
  checkUpdate: BASE_URI + 'cgi-bin/check-update',
  importRemote: BASE_URI + 'cgi-bin/import-remote',
  getHistory: BASE_URI + 'cgi-bin/history'
}, GET_CONF));

exports.socket = $.extend(createCgi({
  changeStatus: {
    mode: 'cancel',
    url: BASE_URI + 'cgi-bin/socket/change-status'
  },
  abort: {
    mode: 'ignore',
    url: BASE_URI + 'cgi-bin/socket/abort'
  },
  send: {
    mode: 'ignore',
    url: BASE_URI + 'cgi-bin/socket/data'
  }
}, POST_CONF));

exports.getInitialData = function (callback) {
  if (!initialDataPromise) {
    initialDataPromise = $.Deferred();

    var load = function() {
      cgi.getInitaial(function (data) {
        if (!data) {
          return setTimeout(load, 1000);
        }
        uploadFiles = data.uploadFiles;
        initialData = data;
        DEFAULT_CONF.data.clientId = data.clientId;
        if (data.lastLogId) {
          lastPageLogTime = data.lastLogId;
        }
        if (data.lastSvrLogId) {
          lastSvrLogTime = data.lastSvrLogId;
        }
        if (data.lastDataId) {
          lastRowId = data.lastDataId;
        }
        exports.upload = createCgi({
          importSessions: BASE_URI + 'cgi-bin/sessions/import?clientId=' + data.clientId,
          importRules: BASE_URI + 'cgi-bin/rules/import?clientId=' + data.clientId,
          importValues: BASE_URI + 'cgi-bin/values/import?clientId=' + data.clientId
        }, $.extend({
          type: 'post'
        }, DEFAULT_CONF, {
          contentType: false,
          processData: false,
          timeout: 36000
        }));
        initialDataPromise.resolve(data);
        if (data.clientIp) {
          exports.clientIp = data.clientIp;
        }
      });
    };
    load();
  }

  initialDataPromise.done(callback);
};

function checkDataChanged(data, mclientName, mtimeName) {
  if (!data[mtimeName] || initialData.clientId === data[mclientName]) {
    return false;
  }

  var mclient = data[mclientName];
  var mtime = data[mtimeName];
  if (initialData[mclientName] === mclient && initialData[mtimeName] === mtime) {
    return false;
  }
  initialData[mclientName] = mclient;
  initialData[mtimeName] = mtime;
  return true;
}

function emitRulesChanged(data) {
  if (checkDataChanged(data, 'mrulesClientId', 'mrulesTime')) {
    events.trigger('rulesChanged');
  }
}

function emitValuesChanged(data) {
  if (checkDataChanged(data, 'mvaluesClientId', 'mvaluesTime')) {
    events.trigger('valuesChanged');
  }
}

function startLoadData() {
  if (startedLoad) {
    return;
  }
  startedLoad = true;
  function load() {
    if (networkModal.clearNetwork) {
      lastRowId = endId || lastRowId;
      networkModal.clearNetwork = false;
    }
    var pendingIds = getPendingIds();
    var startTime = getStartTime();
    var len = logList.length;
    var svrLen = svrLogList.length;
    var startLogTime = -1;
    var startSvrLogTime = -1;

    if (!exports.pauseConsoleRefresh && len < 100) {
      startLogTime = lastPageLogTime;
    }

    if (!exports.pauseServerLogRefresh && svrLen < 70) {
      startSvrLogTime = lastSvrLogTime;
    }

    var curActiveItem = networkModal.getActive();
    var curFrames = curActiveItem && curActiveItem.frames;
    var lastFrameId, curReqId;
    if (curFrames && !curActiveItem.pauseRecordFrames) {
      if (curActiveItem.stopRecordFrames) {
        curReqId = curActiveItem.id;
        lastFrameId = -3;
      } else if (curFrames.length <= MAX_FRAMES_LENGTH) {
        curReqId = curActiveItem.id;
        lastFrameId = curActiveItem.lastFrameId;
      }
    }
    var count = inited ? 20 : networkModal.getDisplayCount();
    var options = {
      startLogTime: exports.stopConsoleRefresh ? -3 : startLogTime,
      startSvrLogTime: exports.stopServerLogRefresh ? -3 : startSvrLogTime,
      ids: pendingIds.join(),
      startTime: startTime,
      dumpCount: dumpCount,
      lastRowId: (inited || !count)  ? lastRowId : undefined,
      curReqId: curReqId,
      lastFrameId: lastFrameId,
      logId: logId || '',
      count: count || 20
    };
    inited = true;
    $.extend(options, hashFilterObj);
    if (onlyViewOwnData) {
      options.ip = 'self';
    }
    cgi.getData(options, function (data) {
      var newIds = data && data.data && data.data.newIds || [];
      setTimeout(load, newIds.length >= 30 ? 30 : 900);
      updateServerInfo(data);
      if (!data || data.ec !== 0) {
        return;
      }
      if (options.dumpCount > 0) {
        dumpCount = 0;
      }
      if (data.clientIp) {
        exports.clientIp = data.clientIp;
      }
      emitRulesChanged(data);
      emitValuesChanged(data);
      directCallbacks.forEach(function (cb) {
        cb(data);
      });
      var len = data.log.length;
      var svrLen = data.svrLog.length;
      if (len || svrLen) {
        if (len) {
          logList.push.apply(logList, data.log);
          lastPageLogTime = data.log[len - 1].id;
        }

        if (svrLen) {
          svrLogList.push.apply(svrLogList, data.svrLog);
          lastSvrLogTime = data.svrLog[svrLen - 1].id;
        }

        logCallbacks.forEach(function (cb) {
          cb(logList, svrLogList);
        });
      }
      if (data.lastLogId) {
        lastPageLogTime = data.lastLogId;
      }
      if (data.lastSvrLogId) {
        lastSvrLogTime = data.lastSvrLogId;
      }

      data = data.data;
      var hasChhanged;
      var framesLen = data.frames && data.frames.length;

      if (framesLen) {
        curActiveItem.lastFrameId = data.frames[framesLen - 1].frameId;
        curFrames.push.apply(curFrames, data.frames);
      } else if (data.lastFrameId) {
        curActiveItem.lastFrameId = data.lastFrameId;
      }
      if (curReqId) {
        var status = data.socketStatus;
        if (status) {
          if (status.sendStatus > -1) {
            hasChhanged = curActiveItem.sendStatus !== status.sendStatus;
            curActiveItem.sendStatus = status.sendStatus;
          }
          if (status.receiveStatus > -1) {
            hasChhanged = hasChhanged || curActiveItem.receiveStatus !== status.receiveStatus;
            curActiveItem.receiveStatus = status.receiveStatus;
          }
        } else {
          if (!curActiveItem.closed) {
            hasChhanged = true;
            curActiveItem.closed = true;
          }
        }
      }
      if (data.lastId) {
        lastRowId = data.lastId;
      }
      if (data.endId) {
        endId = data.endId;
      }
      if ((!data.ids.length && !data.newIds.length) || networkModal.clearNetwork) {
        if (hasChhanged || framesLen) {
          framesUpdateCallbacks.forEach(function(cb) {
            cb();
          });
        }
        return;
      }
      var ids = data.newIds;
      data = data.data;
      dataList.forEach(function (item) {
        var newItem = data[item.id];
        if (newItem) {
          $.extend(item, newItem);
          if (item.rules && item.codec) {
            item.rules.codec = item.codec;
          }
          setReqData(item);
        } else {
          item.lost = true;
        }
      });
      if (ids.length) {
        var filter = getFilterText();
        var excludeFilter = filter.disabledExcludeText ? null : resolveFilterText(filter.excludeText);
        var includeFilter = filter.disabledFilterText ? null : resolveFilterText(filter.filterText);
        ids.forEach(function (id) {
          var item = data[id];
          if (item) {
            if ((!excludeFilter || !checkFilter(item, excludeFilter))
              && (!includeFilter || checkFilter(item, includeFilter))) {
              setReqData(item);
              dataList.push(item);
            }
          }
        });
      }
      dataCallbacks.forEach(function (cb) {
        cb(networkModal);
      });
    });
  }
  load();
}

function setRawHeaders(obj) {
  var headers = obj.headers;
  var rawHeaderNames = obj.rawHeaderNames;
  if (!headers || !rawHeaderNames) {
    return;
  }
  var rawHeaders = {};
  Object.keys(headers).forEach(function (name) {
    rawHeaders[rawHeaderNames[name] || name] = headers[name];
  });
  obj.rawHeaders = rawHeaders;
}

function isSocket(item) {
  if (!item || !item.endTime || item.reqError || item.resError) {
    return false;
  }
  if (/^wss?:\/\//.test(item.url)) {
    return item.res.statusCode == 101;
  }
  return item.inspect || (item.isHttps && item.req.headers['x-whistle-policy'] === 'tunnel');
}

function setReqData(item) {
  var url = item.url;
  var req = item.req;
  var res = item.res;
  item.method = req.method;
  var end = item.endTime;
  var defaultValue = end ? '' : '-';
  var resHeaders = res.headers || '';
  item.hostIp = res.ip || defaultValue;
  item.clientIp = req.ip || '127.0.0.1';
  item.date = item.date || new Date(item.startTime).toLocaleString();
  item.clientPort = req.port;
  item.serverPort = item.res.port;
  item.contentEncoding = resHeaders['content-encoding'];
  item.body = res.size == null ? defaultValue : res.size;
  var result = res.statusCode == null ? defaultValue : res.statusCode;
  item.result = /^[1-9]/.test(result) && parseInt(result, 10) || result;
  item.type = (resHeaders['content-type'] || defaultValue).split(';')[0].toLowerCase();
  item.dns = item.request = item.response = item.download = item.time = defaultValue;
  if (item.dnsTime > 0) {
    item.dns = item.dnsTime - item.startTime + 'ms';
    if (item.requestTime > 0) {
      item.request =  item.requestTime - item.dnsTime + 'ms';
      if (item.responseTime > 0) {
        item.response = item.responseTime - item.requestTime + 'ms';
        if (end > 0) {
          item.download = end - item.responseTime + 'ms';
          item.time = end - item.startTime + 'ms';
        }
      }
    }
  }
  
  setRawHeaders(req);
  setRawHeaders(res);

  if (!item.path) {
    item.protocol = item.isHttps ? 'HTTP' : util.getProtocol(url);
    item.hostname = item.isHttps ? 'Tunnel to' : util.getHost(url);
    var pathIndex = url.indexOf('://');
    if (pathIndex !== -1) {
      pathIndex = url.indexOf('/', pathIndex + 3);
      item.path = pathIndex === -1 ? '/' : url.substring(pathIndex);
    } else {
      item.path = url;
    }
    if (item.path.length > MAX_PATH_LENGTH) {
      item.path = item.path.substring(0, MAX_PATH_LENGTH) + '...';
    }
  }
  if (!item.frames && isSocket(item)) {
    item.frames = [];
  }
}

exports.addNetworkList = function (list) {
  if (!Array.isArray(list) || !list.length) {
    return;
  }
  var hasData;
  list.forEach(function (data) {
    if (!data || !(data.startTime >= 0) || !data.req ||
      !data.req.headers || !data.res) {
      return;
    }
    delete data.active;
    delete data.selected;
    delete data.hide;
    delete data.order;
    delete data.req.json;
    delete data.res.json;
    if (Array.isArray(data.frames)) {
      data.frames = data.frames.filter(function(frame) {
        if (frame) {
          delete frame.json;
        }
        return frame;
      });
    }
    data.lost = true;
    data.id = data.startTime + '-' + ++dataIndex;
    setReqData(data);
    dataList.push(data);
    hasData = true;
  });
  if (hasData) {
    dataCallbacks.forEach(function (cb) {
      cb(networkModal);
    });
  }
};

function getPendingIds() {
  var pendingIds = [];
  dataList.forEach(function (item) {
    if (!item.endTime && !item.lost) {
      pendingIds.push(item.id);
    }
  });
  return pendingIds;
}

function getStartTime() {
  if (!inited) {
    return clearNetwork ? -2 : '';
  }
  if (dataList.length - 1 > MAX_COUNT || exports.stopRefresh) {
    return -1;
  }
  return lastRowId || '0';
}

var updateCount = 0;

function updateServerInfo(data) {
  if (!serverInfoCallbacks.length) {
    updateCount = 0;
    return;
  }

  if (!(data = data && data.server)) {
    ++updateCount;
    if (updateCount > 3) {
      curServerInfo = data;
      serverInfoCallbacks.forEach(function (cb) {
        cb(false);
      });
    }
    return;
  }
  updateCount = 0;
  if (curServerInfo && curServerInfo.strictMode != data.strictMode) {
    curServerInfo.strictMode = data.strictMode;
    events.trigger('updateStrictMode');
  }
  if (curServerInfo && curServerInfo.version == data.version &&
    curServerInfo.networkMode === data.networkMode && curServerInfo.multiEnv === data.multiEnv &&
    curServerInfo.baseDir == data.baseDir && curServerInfo.username == data.username &&
    curServerInfo.port == data.port && curServerInfo.host == data.host &&
    curServerInfo.ipv4.sort().join() == data.ipv4.sort().join() &&
    curServerInfo.ipv6.sort().join() == data.ipv6.sort().join()) {
    return;
  }
  curServerInfo = data;
  serverInfoCallbacks.forEach(function (cb) {
    cb(data);
  });

}

exports.isMutilEnv = function() {
  return curServerInfo && curServerInfo.multiEnv;
};
exports.isStrictMode = function() {
  return (curServerInfo && curServerInfo.strictMode) || false;
};

exports.on = function (type, callback) {
  startLoadData();
  if (type == 'data') {
    if (typeof callback == 'function') {
      dataCallbacks.push(callback);
      callback(networkModal);
    }
  } else if (type == 'serverInfo') {
    if (typeof callback == 'function') {
      serverInfoCallbacks.push(callback);
    }
  } else if (type == 'log') {
    if (typeof callback == 'function') {
      logCallbacks.push(callback);
      callback(logList, svrLogList);
    }
  } else if (type === 'plugins' || type === 'settings' || type === 'rules') {
    if (typeof callback == 'function') {
      directCallbacks.push(callback);
    }
  } else if (type == 'framesUpdate') {
    if (typeof callback == 'function') {
      framesUpdateCallbacks.push(callback);
    }
  }
};

exports.stopNetworkRecord = function(stop) {
  if (!stop && exports.pauseRefresh) {
    networkModal.clearNetwork = false;
  } else {
    networkModal.clearNetwork = !stop;
  }
  exports.pauseRefresh = false;
  exports.stopRefresh = stop;
};
exports.pauseNetworkRecord = function() {
  networkModal.clearNetwork = false;
  exports.pauseRefresh = true;
  exports.stopRefresh = true;
};

exports.pauseConsoleRecord = function() {
  exports.stopConsoleRefresh = false;
  exports.pauseConsoleRefresh = true;
};

exports.stopConsoleRecord = function(stop) {
  exports.pauseConsoleRefresh = false;
  exports.stopConsoleRefresh = stop;
};

exports.pauseServerLogRecord = function() {
  exports.stopServerLogRefresh = false;
  exports.pauseServerLogRefresh = true;
};

exports.stopServerLogRecord = function(stop) {
  exports.pauseServerLogRefresh = false;
  exports.stopServerLogRefresh = stop;
};
