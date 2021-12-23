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

function getBridge() {
  return {
    importSessions: dataCenter.importAnySessions,
    msgBox: message,
    qrCode: qrCode,
    qrcode: qrCode,
    decodeBase64: util.decodeBase64,
    alert: mockWin.alert,
    confirm: mockWin.confirm,
    request: function(options, cb) {
      var request = createCgi(compatAjax(options));
      return request(options.data, cb);
    },
    createRequest: function(options) {
      return createCgi(compatAjax(options));
    },
    showModal: modal.show,
    getServerInfo: function() {
      var serverInfo = dataCenter.getServerInfo();
      return serverInfo && $.extend(true, {}, serverInfo);
    },
    importRules: function(data) {
      if (!data) {
        return;
      }
      var list = util.parseImportData(data, dataCenter.rulesModal);
      var handleImport = function(sure) {
        if (sure) {
          data = {};
          list.forEach(function(item) {
            data[item.name] = item.value;
          });
          events.trigger('uploadRules', data);
        }
      };
      if (!list.hasConflict) {
        return handleImport(true);
      }
      mockWin.confirm('Conflict with existing content, whether to continue to overwrite them?', handleImport);
    },
    importValues: function(data) {
      if (!data) {
        return;
      }
      var list = util.parseImportData(data, dataCenter.valuesModal, true);
      var handleImport = function(sure) {
        if (sure) {
          data = {};
          list.forEach(function(item) {
            data[item.name] = item.value;
          });
          events.trigger('uploadValues', data);
        }
      };
      if (!list.hasConflict) {
        return handleImport(true);
      }
      mockWin.confirm('Conflict with existing content, whether to continue to overwrite them?', handleImport);
    }
  };
}

module.exports = getBridge;
