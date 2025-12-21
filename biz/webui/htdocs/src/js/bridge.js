var qrCode = require('qrcode');
var $ = require('jquery');
var message = require('./message');
var createCgi = require('./cgi').createCgi;
var dataCenter = require('./data-center');
var util = require('./util');
var modal = require('./modal');
var events = require('./events');
var mockWin = require('./win');
var parseRules = require('./parse-rules');

var dataModal = dataCenter.networkModal;

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

function getBridge(win, api) {
  var plugin = getPlugin(win);
  var result = {
    updateUI: function() {
      events.trigger('updateUIThrottle');
    },
    pageId: dataCenter.getPageId(),
    getWhistleId: function() {
      return dataCenter.whistleId;
    },
    hasWhistleToken: function() {
      return dataCenter.hasWhistleToken;
    },
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
      events.trigger('showNetwork');
    },
    showRules: function (name) {
      events.trigger('showRules', name);
    },
    showValues: function () {
      events.trigger('showValues');
    },
    showPlugins: function () {
      events.trigger('showPlugins');
    },
    getActiveSession: function () {
      return dataModal.getActive();
    },
    getSelectedSessionList: function () {
      return dataModal.getSelectedList();
    },
    importMockData: function(data) {
      return util.handleImportData(data);
    },
    download: function(data) {
      events.trigger('download', [data]);
    },
    showOption: function() {
      events.trigger('showPluginOption', plugin);
    },
    hideOption: function() {
      events.trigger('hidePluginOption', plugin);
    },
    setNetworkSettings: function(data) {
      events.trigger('setNetworkSettings', data);
    },
    setRulesSettings: function(data) {
      events.trigger('setRulesSettings', data);
    },
    setValuesSettings: function(data) {
      events.trigger('setValuesSettings', data);
    },
    setComposerData: function(data) {
      events.trigger('setComposerData', data);
    },
    readFileAsText: util.readFileAsText,
    readFileAsBase64: util.readFileAsBase64,
    showHttpsSettings: function() {
      events.trigger('showHttpsSettingsDialog');
    },
    showCustomCerts: function() {
      events.trigger('showCustomCerts');
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
      events.trigger('showInstallPlugins', [list, registry]);
    },
    showUpdatePlugins: function(list, registry) {
      events.trigger('showUpdatePlugins', [list, registry]);
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
      events.trigger('handleImportRules', data);
    },
    importValues: function (data) {
      events.trigger('handleImportValues', data);
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
