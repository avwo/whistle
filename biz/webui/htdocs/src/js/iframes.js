var util = require('./util');
var modal = require('./modal');
var getBridge = require('./bridge');

var MAX_COUNT = 6;
var MAX_CACHE_TIME = 1000 * 60 * 3;
var TIMEOUT = 1000 * 60;
var cache = {};
var latestItem;

function destroy(item) {
  if (item === latestItem) {
    return;
  }
  try {
    document.body.removeChild(item.iframe);
    item.destroyed = true;
    item.dialogs.forEach(function (dialog) {
      dialog.hide(true);
    });
    item.dialogs = [];
    delete cache[item.page];
  } catch (e) {}
}

var detectTimeout = function () {
  detectTimeout = util.noop;
  setInterval(function () {
    var now = Date.now();
    Object.keys(cache).forEach(function (key) {
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
    var index = page.lastIndexOf('?');
    if (index !== -1) {
      ++index;
      var len = parseInt(page.substring(index), 10);
      if (len > 0) {
        page = page.substring(index - len, index);
      }
    }
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
    var bridge = getBridge(win);
    bridge.createModal = function (options) {
      var dialog = modal.create(options);
      var hide = dialog.hide;
      dialog.hide = function (_destroy) {
        if (_destroy) {
          var index = item.dialogs.indexOf(dialog);
          index !== -1 && item.dialogs.splice(index, 1);
        }
        hide(_destroy);
      };
      item.dialogs.push(dialog);
      return dialog;
    };
    win.initWhistleBridge(bridge);
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

exports.fork = function (page, options) {
  try {
    // 保持状态
    options = JSON.parse(JSON.stringify(options));
  } catch (e) {}
  page += '???_WHISTLE_PLUGIN_EXT_CONTEXT_MENU_' + options.port + '???';
  var item = (latestItem = cache[page]);
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
  cache[page] =
    latestItem =
    item =
    {
      page: page,
      list: [options],
      mtime: Date.now(),
      iframe: iframe,
      dialogs: []
    };
  document.body.appendChild(iframe);
  iframe.src = page + page.length;
  setTimeout(function () {
    !item.emit && destroy(item);
  }, TIMEOUT);
};
