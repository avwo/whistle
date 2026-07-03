var qrCode = require('qrcode');
var $ = require('jquery');
var message = require('./message');
var createCgi = require('./cgi').createCgi;
var dataCenter = require('./data-center');
var util = require('./util');
var modal = require('./modal');
var mockWin = require('./win');
var parseRules = require('./parse-rules');

var trigger = util.trigger;
var dataModal = dataCenter.networkModal;
var isStr = util.isStr;

function compatAjax(options) {
  if (!isStr(options)) {
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

function getBridge(win, api) {
  var plugin = getPlugin(win);
  var result = {
    updateUI: function() {
      trigger('updateUIThrottle');
    },
    pageId: dataCenter.getPageId(),
    escapeHtml: util.escape,
    compose: dataCenter.compose,
    createComposeInterrupt: dataCenter.createComposeInterrupt,
    importSessions: dataCenter.importAnySessions,
    exportSessions: dataCenter.exportSessions,
    msgBox: message,
    qrCode: qrCode,
    qrcode: qrCode,
    decodeBase64: util.decodeBase64,
    joinBase64: util.joinBase64,
    getReqId: dataCenter.getReqId,
    onComposeData: dataCenter.onComposeData,
    offComposeData: dataCenter.offComposeData,
    alert: mockWin.alert,
    confirm: mockWin.confirm,
    showNetwork: function () {
      trigger('showNetwork');
    },
    showRules: function (name) {
      trigger('showRules', name);
    },
    showValues: function () {
      trigger('showValues');
    },
    showPlugins: function () {
      trigger('showPlugins');
    },
    getActiveSession: function () {
      return dataModal.getActive();
    },
    getSelectedSessionList: function () {
      return dataModal.getSelectedList();
    },
    getRawRequest: util.getRawReq,
    getRawResponse: util.getRawRes,
    importMockData: function(data) {
      return util.handleImportData(data);
    },
    download: function(data) {
      trigger('download', [data]);
    },
    showOption: function() {
      trigger('showPluginOption', plugin);
    },
    hideOption: function() {
      trigger('hidePluginOption', plugin);
    },
    setNetworkSettings: function(data) {
      trigger('setNetworkSettings', data);
    },
    setRulesSettings: function(data) {
      trigger('setRulesSettings', data);
    },
    setValuesSettings: function(data) {
      trigger('setValuesSettings', data);
    },
    setComposerData: function(data) {
      trigger('setComposerData', data);
    },
    readFileAsText: util.readFileAsText,
    readFileAsBase64: util.readFileAsBase64,
    showHttpsSettings: function() {
      trigger('showHttpsSettingsDialog');
    },
    showCustomCerts: function() {
      trigger('showCustomCerts');
    },
    uploadCustomCerts: function(data, cb) {
      return dataCenter.uploadCerts(data, cb);
    },
    showService: util.showService,
    hideService: util.hideService,
    getInstalledPlugins: function() {
      return dataCenter.getInstalledPlugins();
    },
    showInstallPlugins: function(list, registry) {
      trigger('showInstallPlugins', [list, registry]);
    },
    showUpdatePlugins: function(list, registry) {
      trigger('showUpdatePlugins', [list, registry]);
    },
    getVersion: function() {
      return dataCenter.version;
    },
    copyText: util.copyText,
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
    parseRules: parseRules,
    showModal: modal.show,
    getServerInfo: function () {
      var serverInfo = dataCenter.getServerInfo();
      return serverInfo && $.extend(true, {}, serverInfo);
    },
    importRules: function (data) {
      trigger('handleImportRules', data);
    },
    importValues: function (data) {
      trigger('handleImportValues', data);
    }
  };
  if (api) {
    Object.keys(api).forEach(function (key) {
      result[key] = api[key];
    });
  }
  return result;
}

module.exports = getBridge;

getBridge.getServiceBridge = function(closeDialog) {
  var bridgeApi = getBridge(null, {
    login: function(data, cb) {
      if (!isStr(data)) {
        data = JSON.stringify(data);
      }
      dataCenter.login(data, cb);
    },
    logout: function(cb) {
      dataCenter.logout(cb);
    }
  });
  bridgeApi.closeDialog = closeDialog;
  bridgeApi.installPlugins = dataCenter.installPluginsFromService;
  return bridgeApi;
};
