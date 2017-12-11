var iconv = require('iconv-lite');
var util = require('./index');

var TIMEOUT = 36000;
var CLEAR_INTERVAL = 5000;
var CACHE_TIME = CLEAR_INTERVAL * 2;
var MAX_LENGTH = 512;
var MIN_LENGTH = 412;
var MAX_SOCKET_LENGTH = 500;
var COUNT = 100;
var count = 0;
var ids = [];
var data = {};
var frames = [];
var proxy, binded, timeout, interval;

function disable() {
  proxy.removeListener('request', handleRequest);
  proxy.removeListener('frame', handleFrame);
  ids = [];
  data = {};
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
  if (frames.length > MAX_SOCKET_LENGTH) {
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
    curData = data[ids[i]];
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
    curData = data[id];
    if (curData.read && (!curData.endTime || now - curData.endTime < CACHE_TIME
        || now - curData.startTime < TIMEOUT)) {
      _ids.push(id);
    } else {
      delete data[id];
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

  var notStartTime = !startTime;
  startTime = ((startTime || Date.now() - 3000) + '').split('-');
  count = Math.min(count || COUNT, len);

  startTime[0] = parseInt(startTime[0], 10) || 0;
  startTime[1] = parseInt(startTime[1], 10) || 0;
  if (notStartTime && lastRowId) {
    lastRowId = (lastRowId + '').split('-');
    lastRowId[0] = parseInt(lastRowId[0], 10) || 0;
    if (lastRowId[0] >= startTime[0]) {
      startTime[0] = lastRowId[0];
      startTime[1] = parseInt(lastRowId[1], 10) || 0;
    }
  }

  if (compareId(ids[0], startTime)) {

    return ids.slice(0, count);
  }

  var end = len - 1;
  if (!end || !compareId(ids[end], startTime)) {

    return  [];
  }

  var index = getIndex(startTime, 0, end);
  return ids.slice(index, index + count);
}

function compareId(curId, refId) {
  curId = curId.split('-');
  return curId[0] > refId[0] || (curId[0] == refId[0] && curId[1] > refId[1]);
}

function getIndex(startTime, start, end) {
  if (end - start <= 1) {
    return compareId(ids[start], startTime) ? start : end;
  }

  var mid = Math.floor((start + end) / 2);
  var id = ids[mid];
  return compareId(id, startTime) ? getIndex(startTime, start, mid) : getIndex(startTime, mid + 1, end);
}

function getList(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.map(function(id, i) {
    var curData = data[id];
    if (curData) {
      curData.read = true;
    }
    return curData;
  });
}

function handleRequest(req) {
  var curData = req.data;
  var id = curData.id = curData.id || (curData.startTime + '-' + ++count);
  data[id] = curData;
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
  function formatFilter(filter) {
    if (!filter) {
      return;
    }
    var url = util.trimStr(filter.url);
    var name = util.trimStr(filter.name);
    var value = util.trimStr(filter.value);
    var ip = util.trimStr(filter.ip);
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
    return result;
  }
  proxy.getData = function get(options) {
    enable();
    options = options || {};
    var data = {};
    var newIds = options.startTime == -1 ? [] : getIds(options.startTime, options.count, options.lastRowId);
    var setData = function(item) {
      if (item) {
        data[item.id] = item;
      }
    };
    options.filter = formatFilter(options.filter);
    if (options.filter) {

    } else {
      if (!options.filter) {
        getList(newIds).forEach(setData);
      }
    }
    getList(options.ids).forEach(setData);
    return {
      ids: options.ids || [],
      newIds: newIds,
      data: data,
      frames: getFrames(options.curReqId, options.lastFrameId)
    };
  };
};
