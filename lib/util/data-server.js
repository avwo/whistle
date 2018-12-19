var net = require('net');
var util = require('./index');
var logger = require('./logger');
var config = require('../config');
var socketMgr = require('../socket-mgr');

if (!(config.reqCacheSize > 0) || config.reqCacheSize < 600) {
  config.reqCacheSize = 600;
}

if (!(config.frameCacheSize > 0) || config.frameCacheSize < 600) {
  config.frameCacheSize = 600;
}

var TIMEOUT = 36000;
var BINDING_TIMEOUT = 6000;
var CLEAR_INTERVAL = 5000;
var CACHE_TIME = 1000 * 60 * 3;
var CACHE_TIMEOUT = 1000 * 60 * 6;
var MAX_LENGTH = config.reqCacheSize;
var OVERFLOW_LENGTH = MAX_LENGTH * 3;
var MAX_CACHE_SIZE = MAX_LENGTH * 2;
var PRESERVE_LEN = 120;
var MAX_FRAMES_LENGTH = config.frameCacheSize;
var COUNT = 100;
var count = 0;
var ids = [];
var reqData = {};
var frames = [];
var proxy, binded, timeout, interval, timer;

function disable() {
  proxy.removeListener('request', handleRequest);
  proxy.removeListener('frame', handleFrame);
  ids = [];
  reqData = {};
  frames = [];
  interval && clearInterval(interval);
  interval = null;
  binded = false;
  clearTimeout(timer);
  timer = null;
}

function resetTimer() {
  timer = null;
}

function enable() {
  if (timer) {
    return;
  }
  timer = setTimeout(resetTimer, BINDING_TIMEOUT);
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
  var overflow = frames.length - MAX_FRAMES_LENGTH;
  overflow > 0 && frames.splice(0, overflow + 60);
  var len = ids.length;
  if (len <= MAX_LENGTH) {
    return;
  }

  var now = Date.now();
  var _ids = [];
  var preserveLen = len;
  overflow = -1;
  if (len >= OVERFLOW_LENGTH) {
    overflow = len - MAX_CACHE_SIZE;
    preserveLen = len - PRESERVE_LEN;
  }
  for (var i = 0; i < len; i++) {
    var id = ids[i];
    var curData = reqData[id];
    if (i > overflow && 
      (i >= preserveLen || 
        (curData.endTime ? now - curData.endTime < CACHE_TIME : now - curData.startTime < CACHE_TIMEOUT))) {
      if (curData.endTime && curData.abort) {
        delete curData.abort;
      }  
      _ids.push(id);
    } else {
      delete reqData[id];
    }
  }
  ids = _ids;
}

function getIds(startTime, count, lastRowId) {
  startTime = startTime || lastRowId;
  if (!startTime) {
    return ids.slice(-count);
  }
  var index = 0;
  if (startTime !== '0') {
    index = ids.indexOf(startTime) + 1;
  }
  return ids.slice(index, index + count);
}

function getList(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.map(function(id, i) {
    return reqData[id];
  });
}

function handleRequest(req) {
  var curData = req.data;
  var id = curData.id = curData.id || (curData.startTime + '-' + ++count);
  var removeAbort = function() {
    if (curData.abort) {
      delete curData.abort;
    }
  };
  req.on('end', removeAbort);
  req.on('error', removeAbort);
  req.on('abort', removeAbort);
  reqData[id] = curData;
  ids.indexOf(id) === -1 && ids.push(id);
}

function decodeData(frame) {
  if (frame.base64 == null) {
    frame.base64 = frame.bin ? frame.bin.toString('base64') : '';
    frame.bin = '';
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
  var count = 16;
  for (var i = 0, len = frames.length; i < len; i++) {
    var frame = frames[i];
    if (frame.reqId === curReqId && (!lastFrameId || frame.frameId > lastFrameId)) {
      result.push(decodeData(frame));
      if (--count <= 0) {
        return result;
      }
    }
  }
  return result;
}

function getLastFrame(curReqId) {
  for (var i = frames.length - 1; i >= 0; i--) {
    var frame = frames[i];
    if (frame.reqId === curReqId) {
      return decodeData(frame);
    }
  }
}

module.exports = function init(_proxy) {
  proxy = _proxy;
  enable();
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
    if (!filter.url && !filter.name && !filter.value && !filter.ip) {
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
  proxy.getLastDataId = function() {
    return ids[ids.length - 1];
  };

  function toBase64String(data) {
    if (Buffer.isBuffer(data.body)) {
      data.base64 = data.body.toString('base64');
      data.body = '';
    }
  }

  proxy.enableCapture = enable;
  proxy.getItem = function(id) {
    var item = reqData[id];
    if (item) {
      toBase64String(item.req);
      toBase64String(item.res);
    }
    return item;
  };
  proxy.abortRequest = function(id) {
    var item = id && reqData[id];
    if (!item || !item.abort) {
      return;
    }
    if (item.endTime) {
      delete item.abort;
    } else {
      item.abort();
    }
  };
  proxy.getFrames = function(options) {
    return getFrames(options.curReqId, options.lastFrameId);
  };
  proxy.getData = function(options, clientIp) {
    enable();
    options = options || {};
    var filter = formatFilter(options, clientIp);
    var data = {};
    var count = options.count;
    var startTime = options.startTime;
    var clearNetwork = !(options.dumpCount > 0) && (count == 0 || startTime == -2);
    if (!clearNetwork) {
      count = count > 0 && count < COUNT ? +count : COUNT;
      if (options.dumpCount > 0) {
        var len = ids.length;
        startTime = ids[len > options.dumpCount ? len - options.dumpCount : 0];
      }
    }
    var newIds = (clearNetwork || startTime == -1) ? [] : getIds(startTime, count, options.lastRowId);
    var setData = function(item) {
      if (item) {
        var req = item.req;
        var res = item.res;
        toBase64String(req);
        toBase64String(res);
        if (config.secureFilter) {
          try {
            item = config.secureFilter(item, clientIp, filter) || item;
          } catch (e) {
            if (config.debugMode) {
              /* eslint-disable no-console */
              console.log(e);
            }
            logger.error(e);
          }
        }
        data[item.id] = item;
      }
    };
    if (newIds.length > 0) {
      if (filter) {
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
    var endId = ids[ids.length - 1];
    var lastFrameId, frames;
    if (options.lastFrameId == -3) {
      var lastFrame = getLastFrame(options.curReqId);
      if (lastFrame) {
        if (lastFrame.closed || lastFrame.err) {
          frames = [lastFrame];
        } else {
          lastFrameId = lastFrame.frameId;
        }
      }
    } else {
      frames = getFrames(options.curReqId, options.lastFrameId);
    }

    return {
      ids: options.ids || [],
      newIds: newIds,
      data: data,
      lastId: clearNetwork ? endId : newIds[newIds.length - 1],
      endId: endId,
      frames: frames,
      lastFrameId: lastFrameId,
      socketStatus: socketMgr.getStatus(options.curReqId)
    };
  };
};
