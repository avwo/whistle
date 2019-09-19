var MAX_COUNT = 5;
var MAX_CACHE_TIME = 1000 * 60 * 3;
var TIMEOUT = 1000 * 60;
var cache = {};
var message = require('./message');
var util = require('./util');

function destroy(item) {
  try {
    document.body.removeChild(item.iframe);
    delete cache[item.page];
  } catch(e) {}
}

var detectTimeout = function() {
  detectTimeout = util.noop;
  setInterval(function() {
    var now = Date.now();
    Object.keys(cache).forEach(function(key) {
      var item = cache[key];
      if (now - item.mtime > MAX_CACHE_TIME) {
        destroy(item);
      }
    });
  }, TIMEOUT);
};

function getItem(win) {
  try {
    var page = win.location.pathname.substring(1) + win.location.search;
    return cache[page];
  } catch (e) {}
}

function onPluginContextMenuReady(win) {
  var item = getItem(win);
  if (!item || item.emit) {
    return;
  }
  function emit(data) {
    try {
      if (typeof win.onWhistleContextMenuClick === 'function') {
        win.onWhistleContextMenuClick(data);
      }
    } catch (e) {}
  }
  try {
    win.initWhistleBridge({
      msgBox: message
    });
  } catch (e) {}
  item.list.forEach(emit);
  item.emit = emit;
  item.list = null;
}

function removeOldest() {
  var keys = Object.keys(cache);
  var len = keys.length;
  if (len < MAX_COUNT) {
    return;
  }
  var oldest = cache[keys[0]];
  for (var i = 1; i < len; i++) {
    var item = cache[keys[i]];
    if (oldest.mtime > item.mtime) {
      oldest = item;
    }
  }
  destroy(oldest);
}

exports.fork = function(page, options) {
  try {
    // 保持状态
    options = JSON.parse(JSON.stringify(options));
  } catch (e) {}
  page += '???_WHISTLE_PLUGIN_EXT_CONTEXT_MENU_???';
  var item = cache[page];
  if (item) {
    item.mtime = Date.now();
    if (item.emit) {
      item.emit(options);
    } else {
      item.list.push(options);
      if (item.list.length > 10) {
        item.list = item.list.slice(-10);
      }
    }
    return;
  }
  removeOldest();
  detectTimeout();
  window.onPluginContextMenuReady = onPluginContextMenuReady;
  var iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  cache[page] = item = {
    page: page,
    list: [options],
    mtime: Date.now(),
    iframe: iframe
  };
  document.body.appendChild(iframe);
  iframe.src = page;
  setTimeout(function() {
    !item.emit && destroy(item);
  }, TIMEOUT);
};
