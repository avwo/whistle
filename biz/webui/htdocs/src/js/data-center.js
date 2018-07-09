var $ = require('jquery');
var createCgi = require('./cgi');
var util = require('./util');
var NetworkModal = require('./network-modal');
var storage = require('./storage');
var events = require('./events');

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
var onlyViewOwnData = storage.get('onlyViewOwnData') == 1;
var DEFAULT_CONF = {
  timeout: TIMEOUT,
  xhrFields: {
    withCredentials: true
  },
  data: {}
};
exports.clientIp = '127.0.0.1';

exports.changeLogId = function(id) {
  logId = id;
};

exports.setOnlyViewOwnData = function(enable) {
  onlyViewOwnData = enable !== false;
  storage.set('onlyViewOwnData', onlyViewOwnData ? 1 : 0);
};
exports.isOnlyViewOwnData = function() {
  return onlyViewOwnData;
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
    filterText: settings.filterText
  }));
}
exports.setFilterText = setFilterText;

function getFilterText() {
  var settings = util.parseJSON(storage.get('filterText'));
  return settings ? {
    disabledFilterText: settings.disabledFilterText,
    filterText: settings.filterText
  } : {};
}
exports.getFilterText = getFilterText;

function hasFilterText() {
  var settings = getFilterText();
  if (!settings || settings.disabledFilterText) {
    return;
  }
  var filterText = settings.filterText;
  if (typeof filterText !== 'string') {
    return '';
  }
  filterText = filterText.trim();
  return filterText;
}

exports.hasFilterText = hasFilterText;

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

var FILTER_TYPES_RE = /^(m|s|i|h|b|c):/;
var FILTER_TYPES = {
  m: 'method',
  s: 'statusCode',
  i: 'ip',
  h: 'headers',
  b: 'body',
  c: 'body'
};
function parseFilterText() {
  var filterText = hasFilterText();
  if (!filterText) {
    return;
  }
  filterText = filterText.split(/\r|\n/g);
  var result = {};
  filterText.forEach(function(line) {
    line = line.trim();
    if (FILTER_TYPES_RE.test(line)) {
      var name = FILTER_TYPES[RegExp.$1];
      line = line.substring(2);
      if (line) {
        result[name] = result[name] ? result[name] + '\n' + line : line;
      }
    } else if (line) {
      result.url = result.url ? result.url + '\n' + line : line;
    }
  });
  return result;
}

var POST_CONF = $.extend({
  type: 'post'
}, DEFAULT_CONF);
var GET_CONF = $.extend({
  cache: false
}, DEFAULT_CONF);
var cgi = createCgi({
  getData: 'cgi-bin/get-data',
  getInitaial: 'cgi-bin/init'
}, GET_CONF);

function toLowerCase(str) {
  return String(str == null ? '' : str).trim().toLowerCase();
}

exports.values = createCgi({
  moveTo: {
    mode: 'chain',
    url: 'cgi-bin/values/move-to'
  },
  list: {
    type: 'get',
    url: 'cgi-bin/values/list'
  },
  add: 'cgi-bin/values/add',
  remove: 'cgi-bin/values/remove',
  rename: 'cgi-bin/values/rename'
}, POST_CONF);

exports.plugins = createCgi({
  disablePlugin: 'cgi-bin/plugins/disable-plugin',
  disableAllPlugins: 'cgi-bin/plugins/disable-all-plugins',
  getPlugins: {
    type: 'get',
    url: 'cgi-bin/plugins/get-plugins'
  }
}, POST_CONF);

exports.rules = createCgi({
  disableAllRules: 'cgi-bin/rules/disable-all-rules',
  moveTo: {
    mode: 'chain',
    url: 'cgi-bin/rules/move-to'
  },
  list: {
    type: 'get',
    url: 'cgi-bin/rules/list'
  },
  add: 'cgi-bin/rules/add',
  disableDefault: 'cgi-bin/rules/disable-default',
  enableDefault: 'cgi-bin/rules/enable-default',
  remove: 'cgi-bin/rules/remove',
  rename: 'cgi-bin/rules/rename',
  select: 'cgi-bin/rules/select',
  unselect: 'cgi-bin/rules/unselect',
  allowMultipleChoice: 'cgi-bin/rules/allow-multiple-choice',
  syncWithSysHosts: 'cgi-bin/rules/sync-with-sys-hosts',
  setSysHosts: 'cgi-bin/rules/set-sys-hosts',
  getSysHosts: 'cgi-bin/rules/get-sys-hosts'
}, POST_CONF);

exports.log = createCgi({
  set: 'cgi-bin/log/set'
}, POST_CONF);

$.extend(exports, createCgi({
  composer: 'cgi-bin/composer',
  interceptHttpsConnects: 'cgi-bin/intercept-https-connects'
}, POST_CONF));
$.extend(exports, createCgi({
  donotShowAgain: 'cgi-bin/do-not-show-again',
  checkUpdate: 'cgi-bin/check-update',
  importRemote: 'cgi-bin/import-remote'
}, GET_CONF));

exports.socket = $.extend(createCgi({
  changeStatus: {
    mode: 'cancel',
    url: 'cgi-bin/socket/change-status'
  },
  abort: {
    mode: 'ignore',
    url: 'cgi-bin/socket/abort'
  },
  send: {
    mode: 'ignore',
    url: 'cgi-bin/socket/data'
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
          importSessions: 'cgi-bin/sessions/import?clientId=' + data.clientId,
          importRules: 'cgi-bin/rules/import?clientId=' + data.clientId,
          importValues: 'cgi-bin/values/import?clientId=' + data.clientId
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

function checkFiled(keyword, text, needDecode) {
  if (!keyword) {
    return true;
  }
  if (!text) {
    return false;
  }
  keyword = toLowerCase(keyword);
  keyword = keyword.split(/\n/g);
  if (needDecode) {
    try {
      var dtext = decodeURIComponent(text);
      if (dtext !== text) {
        text += '\n' + dtext;
      }
    } catch(e) {}
  }
  text = toLowerCase(text);
  var check = function(kw) {
    if (!kw) {
      return false;
    }
    kw = kw.split(/\s+/g);
    return checkKeyword(text, kw[0]) && checkKeyword(text, kw[1]) && checkKeyword(text, kw[2]);
  };

  return check(keyword[0]) || check(keyword[1]) || check(keyword[2]);
}

function checkKeyword(text, kw) {
  if (!kw || kw === '!') {
    return true;
  }
  var not;
  if (kw[0] === '!') {
    not = true;
    kw = kw.substring(1);
  }
  kw = text.indexOf(kw);
  return not ? kw === -1 : kw !== -1;
}

function joinString(str1, str2) {
  var result = [];
  if (str1 != null || str1) {
    result.push(str1);
  }
  if (str2 == null || str2) {
    result.push(str2);
  }
  return result.join('\n');
}

function filterData(obj, item) {
  if (!obj) {
    return true;
  }
  if (!checkFiled(obj.url, item.url)) {
    return false;
  }
  if (!checkFiled(obj.statusCode, item.res.statusCode)) {
    return false;
  }
  if (!checkFiled(obj.method, item.req.method)) {
    return false;
  }
  if (obj.ip) {
    if (!checkFiled(obj.ip, joinString(item.req.ip, item.res.ip))) {
      return false;
    }
  }
  if (obj.body) {
    if (!checkFiled(obj.body, joinString(util.getBody(item.req, true), util.getBody(item.res)))) {
      return false;
    }
  }
  if (obj.headers) {
    if (!checkFiled(obj.headers, joinString(util.objectToString(item.req.headers),
      util.objectToString(item.res.headers)), true)) {
      return false;
    }
  }
  return true;
}

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

    if (!len) {
      startLogTime = lastPageLogTime;
    } else if (len < 100) {
      startLogTime = logList[len - 1].id;
    }

    if (!svrLen) {
      startSvrLogTime = lastSvrLogTime;
    } else if (svrLen < 70) {
      startSvrLogTime = svrLogList[svrLen - 1].id;
    }

    var curActiveItem = networkModal.getActive();
    var curFrames = curActiveItem && curActiveItem.frames;
    var lastFrameId, curReqId;
    if (curFrames && curFrames.length <= MAX_FRAMES_LENGTH) {
      curReqId = curActiveItem.id;
      lastFrameId = curActiveItem.lastFrameId;
    }
    var count = inited ? 20 : networkModal.getDisplayCount();
    var options = {
      startLogTime: startLogTime,
      startSvrLogTime: startSvrLogTime,
      ids: pendingIds.join(),
      startTime: startTime,
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

      data = data.data;
      var hasChhanged;
      var framesLen = data.frames && data.frames.length;
      if (framesLen) {
        curActiveItem.lastFrameId = data.frames[framesLen - 1].frameId;
        curFrames.push.apply(curFrames, data.frames);
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
          setReqData(item);
        } else {
          item.lost = true;
        }
      });
      if (ids.length) {
        var filterObj = parseFilterText();
        ids.forEach(function (id) {
          var item = data[id];
          if (item) {
            if (filterData(filterObj, item)) {
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
    if (name !== 'x-whistle-https-request' && name.indexOf('x-forwarded-from-whistle-') !== 0) {
      rawHeaders[rawHeaderNames[name] || name] = headers[name];
    }
  });
  obj.rawHeaders = rawHeaders;
}

function isSocket(item) {
  if (!item || !item.endTime || item.reqError || item.resError) {
    return false;
  }
  if (/^wss?:\/\//.test(item.url) || item.inspect) {
    return true;
  }
  return item.isHttps && item.req.headers['x-whistle-policy'] === 'tunnel';
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
  if (dataList.length - 1 > MAX_COUNT) {
    return -1;
  }
  return lastRowId || '0';
}

function updateServerInfo(data) {
  if (!serverInfoCallbacks.length) {
    return;
  }

  if (!(data = data && data.server)) {
    curServerInfo = data;
    serverInfoCallbacks.forEach(function (cb) {
      cb(false);
    });
    return;
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
