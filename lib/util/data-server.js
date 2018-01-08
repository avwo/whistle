var iconv = require('iconv-lite');
var net = require('net');
var util = require('./index');
var config = require('../config');

if (!(config.reqCacheSize > 0) || config.reqCacheSize < 512) {
  config.reqCacheSize = 512;
}

if (!(config.frameCacheSize > 0) || config.frameCacheSize < 512) {
  config.frameCacheSize = 512;
}

var TIMEOUT = 36000;
var CLEAR_INTERVAL = 5000;
var CACHE_TIME = CLEAR_INTERVAL * 2;
var MAX_LENGTH = config.reqCacheSize;
var MIN_LENGTH = MAX_LENGTH - 100;
var MAX_FRAMES_LENGTH = config.frameCacheSize;
var COUNT = 100;
var count = 0;
var ids = [];
var reqData = {};
var frames = [];
var proxy, binded, timeout, interval;

function disable() {
  proxy.removeListener('request', handleRequest);
  proxy.removeListener('frame', handleFrame);
  ids = [];
  reqData = {};
  frames = [];
  interval && clearInterval(interval);
  interval = null;
  binded = false;
}

function enable() {
  if (!binded) {
    binded = true;
    proxy.on('request', handleRequest);
    proxy.on('frame', handleFrame);
  }
  clearTimeout(timeout);
  timeout = setTimeout(disable, TIMEOUT);
  if (!interval) {
    interval = setInterval(clearCache, CLEAR_INTERVAL);
  }
}

/**
* 如果超过最大缓存数，清理如下请求数据：
* 1. 已经请求结束且结束时间超过10秒
* 2. 请求#1前面的未结束且未被ui读取过的请求
*/
function clearCache() {
  if (frames.length > MAX_FRAMES_LENGTH) {
    frames.splice(0, 100);
  }
  var len = ids.length;
  if (len <= MAX_LENGTH) {
    return;
  }

  var index = -1; //已经完成，且缓存超过10s的最后一个请求
  var now = Date.now();
  var i, curData;
  for (i = len - 1; i >= 0; i--) {
    curData = reqData[ids[i]];
    if (curData.endTime && now - curData.endTime > TIMEOUT) {
      index = i;
      break;
    }
  }

  if (index < 0) {
    return;
  }

  var _ids = [];
  ++index;
  for (i = 0; i < index; i++) {
    var id = ids[i];
    curData = reqData[id];
    if (curData.read && (!curData.endTime || now - curData.endTime < CACHE_TIME
        || now - curData.startTime < TIMEOUT)) {
      _ids.push(id);
    } else {
      delete reqData[id];
      if (--len <= MIN_LENGTH) {
        _ids.push.apply(_ids, ids.slice(i + 1, index));
        break;
      }
    }
  }
  ids = _ids.concat(ids.slice(index));
}

function getIds(startTime, count, lastRowId) {
  var len = ids.length;
  if (!len) {
    return [];
  }
  startTime = startTime || lastRowId;
  if (!startTime) {
    return ids.slice(-count);
  }
  for (var i = 0; i < len; i++) {
    if (ids[i] === startTime) {
      return ids.slice(i + 1, i + 1 + count);
    }
  }
  return ids.slice(0, count);
}

function getList(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.map(function(id, i) {
    var curData = reqData[id];
    if (curData) {
      curData.read = true;
    }
    return curData;
  });
}

function handleRequest(req) {
  var curData = req.data;
  var id = curData.id = curData.id || (curData.startTime + '-' + ++count);
  reqData[id] = curData;
  ids.indexOf(id) === -1 && ids.push(id);
}

function decodeData(frame) {
  if (frame.text != null) {
    return frame;
  }
  if (frame.bin) {
    var result = [];
    frame.bin.forEach(function(b) {
      b = b.toString(16).toUpperCase();
      result.push(b.length > 1 ? b : '0' + b);
    });
    try {
      frame.text = iconv.decode(frame.bin, frame.charset || 'utf8');
    } catch (e) {
      frame.text = frame.bin + '';
    }
    frame.bin = result.join('');
  } else {
    frame.bin = frame.text = '';
  }

  return frame;
}
function handleFrame(data) {
  frames.push(data);
}

function getFrames(curReqId, lastFrameId) {
  if (!curReqId) {
    return;
  }
  var result = [];
  var count = 10;
  for (var i = frames.length - 1; i >= 0; i--) {
    var frame = frames[i];
    if (frame.reqId === curReqId && (lastFrameId ? frame.frameId > lastFrameId : count > 0)) {
      result.push(decodeData(frame));
      if (--count <= 0) {
        break;
      }
    }
  }
  return result.reverse();
}

module.exports = function init(_proxy) {
  proxy = _proxy;
/**
* options: {
* 		startTime: timestamp || timestamp + '-' + count
* 		count: 获取新数据的数量
* 		ids: 请未结束的id列表
* }
*
* @param options
*/
  function formatFilter(filter, clientIp) {
    if (!filter) {
      return;
    }
    var url = util.trimStr(filter.url).toLowerCase();
    var name = util.trimStr(filter.name).toLowerCase();
    var value = util.trimStr(filter.value).toLowerCase();
    var ip = util.trimStr(filter.ip);
    var list = [];
    if (ip === 'self') {
      ip = clientIp;
    } else if (ip && !net.isIP(ip)) {
      ip.split(',').forEach(function(item) {
        item = item.trim();
        if (item === 'self') {
          item = clientIp;
        }
        if (net.isIP(item) && list.indexOf(item) === -1) {
          list.push(item);
        }
      });
      ip = null;
    }
    var result;
    if (url) {
      result = {};
      result.url = url;
    }
    if (name && value) {
      result = result || {};
      result.name = name;
      result.value = value;
    }
    if (ip) {
      result = result || {};
      result.ip = ip;
    }
    if (list.length) {
      result = result || {};
      result.ipList = list.slice(0, 16);
    }
    return result;
  }
  function checkClientIp(item, filter) {
    var clientIp = item.req.ip;
    if (filter.ip && clientIp !== filter.ip) {
      return false;
    }
    var ipList = filter.ipList;
    if (!ipList) {
      return true;
    }
    var len = ipList.length;
    if (len < 3) {
      if (ipList[0] === clientIp) {
        return true;
      }
      if (ipList[1] && ipList[1] === clientIp) {
        return true;
      }
    } else {
      for (var i = 0; i < len; i++) {
        var ip = ipList[i];
        if (ip === clientIp) {
          return true;
        }
      }
    }
    return false;
  }
  function checkItem(item, filter) {
    if (!item) {
      return false;
    }
    if (!checkClientIp(item, filter)) {
      return false;
    }
    if (filter.url && item.url.toLowerCase().indexOf(filter.url) === -1) {
      return false;
    }
    if (!filter.name) {
      return true;
    }
    var value = item.req.headers[filter.name];
    if (!value || typeof value !== 'string') {
      if (!Array.isArray(value)) {
        return false;
      }
      value = value.join('\n');
    }
    value = value.toLowerCase();
    if (value.indexOf(filter.value) !== -1) {
      return true;
    }
    return value.indexOf(util.encodeURIComponent(filter.value).toLowerCase()) !== -1;
  }
  proxy.getData = function(options, clientIp) {
    enable();
    options = options || {};
    var data = {};
    var newIds = options.startTime == -1 ? [] : getIds(options.startTime, options.count, options.lastRowId);
    var setData = function(item) {
      if (item) {
        data[item.id] = item;
      }
    };
    if (newIds.length > 0) {
      var filter = formatFilter(options, clientIp);
      if (filter) {
        var count = options.count > 0 ? options.count : COUNT;
        var id = newIds[0];
        var index = ids.indexOf(newIds[0]);
        newIds = [];
        while(id && count > 0) {
          var item = reqData[id];
          if (checkItem(item, filter)) {
            setData(item);
            newIds.push(id);
            --count;
          }
          id = ids[++index];
        }
      } else if (!filter) {
        getList(newIds).forEach(setData);
      }
    }
    getList(options.ids).forEach(setData);
    return {
      ids: options.ids || [],
      newIds: newIds,
      data: data,
      lastId: newIds[newIds.length - 1] || ids[ids.length - 1],
      frames: getFrames(options.curReqId, options.lastFrameId)
    };
  };
};
