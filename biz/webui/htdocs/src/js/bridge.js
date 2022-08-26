var qrCode = require('qrcode');
var $ = require('jquery');
var message = require('./message');
var createCgi = require('./cgi').createCgi;
var dataCenter = require('./data-center');
var util = require('./util');
var modal = require('./modal');
var events = require('./events');
var mockWin = require('./win');

function compatAjax(options) {
  if (typeof options !== 'string') {
    options.type = options.type || options.method;
  }
  return options;
}

function getPlugin(win) {
  if (!win) {
    return;
  }
  try {
    var pathname = win.location.pathname.split('/');
    for (var i = pathname.length - 1; i >= 0; i--) {
      var name = pathname[i];
      if (/^plugin\.([a-z\d_\-]+)$/.test(name)) {
        var plugin = dataCenter.getPlugin(RegExp.$1  + ':');
        if (plugin) {
          return plugin;
        }
      }
    }
  } catch (e) {}
}

function getBridge(win) {
  var plugin = getPlugin(win);
  return {
    pageId: dataCenter.getPageId(),
    compose: dataCenter.compose,
    importSessions: dataCenter.importAnySessions,
    msgBox: message,
    qrCode: qrCode,
    qrcode: qrCode,
    decodeBase64: util.decodeBase64,
    alert: mockWin.alert,
    confirm: mockWin.confirm,
    syncData: function(cb) {
      plugin && dataCenter.syncData(plugin, cb);
    },
    syncRules: function() {
      plugin && dataCenter.syncRules(plugin);
    },
    syncValues: function() {
      plugin && dataCenter.syncValues(plugin);
    },
    request: function (options, cb) {
      var request = createCgi(compatAjax(options));
      return request(options.data, cb);
    },
    createRequest: function (options) {
      return createCgi(compatAjax(options));
    },
    showModal: modal.show,
    getServerInfo: function () {
      var serverInfo = dataCenter.getServerInfo();
      return serverInfo && $.extend(true, {}, serverInfo);
    },
    importRules: function (data) {
      if (!data) {
        return;
      }
      var list = util.parseImportData(data, dataCenter.rulesModal);
      var handleImport = function (sure) {
        if (sure) {
          data = {};
          list.forEach(function (item) {
            data[item.name] = item.value;
          });
          events.trigger('uploadRules', data);
        }
      };
      if (!list.hasConflict) {
        return handleImport(true);
      }
      mockWin.confirm(
        'Conflict with existing content, whether to continue to overwrite them?',
        handleImport
      );
    },
    importValues: function (data) {
      if (!data) {
        return;
      }
      var list = util.parseImportData(data, dataCenter.valuesModal, true);
      var handleImport = function (sure) {
        if (sure) {
          data = {};
          list.forEach(function (item) {
            data[item.name] = item.value;
          });
          events.trigger('uploadValues', data);
        }
      };
      if (!list.hasConflict) {
        return handleImport(true);
      }
      mockWin.confirm(
        'Conflict with existing content, whether to continue to overwrite them?',
        handleImport
      );
    }
  };
}

module.exports = getBridge;
