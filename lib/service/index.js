var fork = require('pfork').fork;
var path = require('path');
var rulesUtil = require('../rules/util');
var ca = require('../https/ca');
var pluginMgr = require('../plugins');
var config = require('../config');

var INTERVAL = 6000;
var curRulesData;
var curValuesData;
var curCertsData;
var curPluginsData;
var curTokenId;

var notEqual = function(oldData, newData) {
  if (!oldData) {
    return true;
  }
  var len;
  var i;
  var newItem;
  var oldItem;
  if (Array.isArray(oldData)) {
    len = oldData.length;
    if (len !== newData.length) {
      return true;
    }
    for (i = 0; i < len; i++) {
      oldItem = oldData[i];
      newItem = newData[i];
      if (oldItem.name !== newItem.name || oldItem.data !== newItem.data) {
        return true;
      }
    }
  } else {
    var oldKeys = Object.keys(oldData);
    var newKeys = Object.keys(newData);
    len = oldKeys.length;
    if (len !== newKeys.length) {
      return true;
    }
    for (i = 0; i < len; i++) {
      var key = oldKeys[i];
      newItem = newData[key];
      if (!newItem) {
        return true;
      }
      oldItem = oldData[key];
      if (oldItem.key !== newItem.key || oldItem.cert !== newItem.cert ||
        oldItem.version !== newItem.version || oldItem.registry !== newItem.registry ||
        oldItem.type !== newItem.type) {
        return true;
      }
    }
  }
  return false;
};

function loadService(callback) {
  fork(
    {
      script: path.join(__dirname, 'service.js'),
      debugMode: config.debugMode,
      TEMP_FILES_PATH: config.TEMP_FILES_PATH,
      PROXY_ID_HEADER: config.PROXY_ID_HEADER,
      host: config.host,
      port: config.port
    },
    callback
  );
}

function toData(list) {
  if (Array.isArray(list)) {
    return list.map(function (item) {
      return {
        name: item.name,
        value: item.data
      };
    });
  }
  return Object.keys(list).map(function (key) {
    return list[key];
  });
}

function saveData() {
  if (!config.tokenId) {
    curRulesData = curCertsData = curValuesData = curPluginsData = null;
    return setTimeout(saveData, INTERVAL);
  }
  if (config.tokenId !== curTokenId) {
    curTokenId = config.tokenId;
    curRulesData = curCertsData = curValuesData = curPluginsData = null;
  }
  loadService(function (err, _, child) {
    setTimeout(saveData, INTERVAL);
    if (err) {
      return;
    }
    var rulesData = rulesUtil.rules.getAllData().list;
    var valuesData = rulesUtil.values.list();
    var certsData = ca.getPureCertFiles();
    var pluginsData = {};
    var plugins = pluginMgr.getPlugins();
    Object.keys(plugins).forEach(function (name) {
      var plugin = plugins[name];
      if (plugin && !plugin.isDev && !plugin.notUn && !plugin.isProj) {
        pluginsData[plugin.moduleName] = {
          name: plugin.moduleName,
          version: plugin.version,
          registry: plugin.registry
        };
      }
    });
    var data;
    if (notEqual(curRulesData, rulesData)) {
      data = { rules: toData(rulesData) };
      curRulesData = rulesData;
    }
    if (notEqual(curValuesData, valuesData)) {
      data = data || {};
      data.values = toData(valuesData);
      curValuesData = valuesData;
    }
    if (notEqual(curCertsData, certsData)) {
      data = data || {};
      data.certs = toData(certsData);
      curCertsData = certsData;
    }
    if (notEqual(curPluginsData, pluginsData)) {
      data = data || {};
      data.plugins = toData(pluginsData);
      curPluginsData = pluginsData;
    }
    data && child.sendData(data);
  });
}

setTimeout(saveData, INTERVAL);

module.exports = loadService;
