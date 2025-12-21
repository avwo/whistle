var fork = require('pfork').fork;
var path = require('path');
var LRU = require('lru-cache');
var rulesUtil = require('../rules/util');
var ca = require('../https/ca');
var pluginMgr = require('../plugins');
var request = require('../util/http-mgr').request;
var config = require('../config');

var SCRIPT = path.join(__dirname, 'service.js');
var errors = new LRU({ max: 60, maxAge: 10000 });
var forkOptions;
var curChild;
var curOptions;


var getOptions = function() {
  if (!forkOptions) {
    forkOptions = {};
    /*eslint no-console: "off"*/
    Object.keys(config).forEach(function (name) {
      var value = config[name];
      var type = typeof value;
      if (type == 'string' || type == 'number' || type === 'boolean') {
        forkOptions[name] = value;
      }
    });
    delete forkOptions.value;
    forkOptions.script = SCRIPT;
  }
  return forkOptions;
};

function handleError(data) {
  var error = data.error || 'unknown error';
  var list = errors.get(data.clientId) || [];
  if (list.indexOf(error) !== -1) {
    return;
  }
  list.push(error);
  if (list.length > 12) {
    list.shift();
  }
  errors.set(data.clientId, list);
}

function loadService(callback) {
  if (curChild) {
    return callback(null, curOptions, curChild);
  }
  fork(getOptions(), function (err, options, child) {
    if (err) {
      return callback(err);
    }
    config.whistleId = options && options.whistleId;
    curOptions = options;
    curChild = child;
    child.once('close', function () {
      curChild = null;
    });
    child.on('data', function (data) {
      if (!data) {
        return;
      }
      var type = data.type;
      if (type === 'w2NetworkInterfacesChange') {
        return process.emit('w2NetworkInterfacesChange');
      }
      if (type === 'whistleIdChange') {
        config.whistleId = data.whistleId;
        config.hasWhistleToken = data.hasWhistleToken;
        child.sendData({ type: 'whistleId', whistleId: config.whistleId, hasWhistleToken: config.hasWhistleToken });
        return;
      }
      if (type === 'error') {
        return handleError(data);
      }
      if (type === 'installPlugins' && config.installPlugins) {
        return config.installPlugins(data.data);
      }
    });
    callback(null, options, child);
  }
  );
}

function formatData(list) {
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

var notEqual = function(oldData, newData) {
  if (!oldData) {
    return true;
  }
  var newLen;
  var len;
  var i;
  var newItem;
  var oldItem;
  if (Array.isArray(oldData)) {
    newLen = newData.length;
    if (!newLen) {
      return false;
    }
    len = oldData.length;
    if (len !== newLen) {
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
    var newKeys = Object.keys(newData);
    newLen = newKeys.length;
    if (!newLen) {
      return false;
    }
    var oldKeys = Object.keys(oldData);
    len = oldKeys.length;
    if (len !== newLen) {
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

var preDataMap = {};
var saveData = function(type, data) {
  if (!notEqual(preDataMap[type], data)) {
    return;
  }
  var str;
  try {
    str = JSON.stringify(formatData(data));
  } catch (e) {}
  if (!str || str.length < 3) {
    return;
  }
  var body = { type: 'data' };
  body[type] = str;
  var sendRequest = function(isRetry) {
    request({
      method: 'POST',
      url: 'http://127.0.0.1:' + curOptions.port + '/cgi-bin/service/save',
      strictMode: true,
      headers: {
        'content-type': 'application/json'
      },
      body: body
    }, function (err) {
      if (err) {
        !isRetry && sendRequest(true);
      } else {
        preDataMap[type] = data;
      }
    });
  };
  sendRequest();
};

function sendData() {
  loadService(function (err) {
    setTimeout(sendData, 3600);
    if (err || !config.hasWhistleToken) {
      return;
    }
    var rulesData = rulesUtil.rules.getAllData().list;
    var valuesData = rulesUtil.values.list();
    var certsData = ca.getPureCertFiles();
    var pluginsData = {};
    var plugins = pluginMgr.getPlugins();
    Object.keys(plugins).sort().forEach(function (name) {
      var plugin = plugins[name];
      if (plugin && !plugin.isDev && !plugin.notUn && !plugin.isProj) {
        pluginsData[plugin.moduleName] = {
          name: plugin.moduleName,
          version: plugin.version,
          registry: plugin.registry
        };
      }
    });
    saveData('rules', rulesData);
    saveData('values', valuesData);
    saveData('certs', certsData);
    saveData('plugins', pluginsData);
  });
}

process.nextTick(sendData);

module.exports = loadService;

config.getInstallPluginErrors = function(clientId) {
  var list = errors.get(clientId);
  errors.del(clientId);
  return list;
};
