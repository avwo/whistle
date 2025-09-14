var rules = require('./index');
var util = require('../util');
var config = require('../config');
var Storage = require('./storage');
var httpMgr = require('../util/http-mgr');

var INTERVAL = 1000 * 60 * 60 * 2;
var MAX_URL_LEN = 10 * 1024;
var MAX_HEADERS_LEN = 128 * 1024;
var MAX_BODY_LEN = 260 * 1024;
var MAX_BASE64_LEN = 360 * 1024;
var MAX_METHOD_LEN = 64;
var MAX_HISTORY_LEN = 64;
var history = [];
var rulesStorage = new Storage(
  config.rulesDir,
  { Default: true },
  config.disableWebUI
);
var valuesStorage = new Storage(config.valuesDir, null, config.disableWebUI);
var propertiesStorage = new Storage(
  config.propertiesDir,
  null,
  config.disableWebUI
);
var LINE_END_RE = /\n|\r\n|\r/g;
var MAX_REMOTE_RULES_COUNT = 16;
var REMOTE_RULES_RE =
  /^\s*@(`?)(whistle\.[a-z\d_\-]+(?:\/[^\s#]*)?|(?:https?:\/\/|[a-z]:[\\/]|~?\/)[^\s#]+|\$(?:whistle\.)?[a-z\d_-]+[/:][^\s#]+)\s*?\1(?:#.*)?$/gim;
var MAX_COUNT_BY_IMPORT = 60;
var MAX_FILENAME_LEN = 60;
var inlineValues = {};
var proxy, pluginMgr;
var serviceRules;
var mockRules;
var dnsOrder = propertiesStorage.getProperty('dnsOrder');

config.ipv6Only = config.ipv6Only || !!propertiesStorage.getProperty('ipv6Only');
if (!config.dnsOrder && !config.setDefaultResultOrder(dnsOrder)) {
  config.dnsOrder = config.defaultDnsOrder;
}

try {
  history = JSON.parse(propertiesStorage.readFile('composerHistory'));
  if (Array.isArray(history)) {
    history = history.filter(checkHistory);
    history = history.slice(0, MAX_HISTORY_LEN);
  } else {
    history = [];
  }
} catch (e) {}

function limitValueLen(name, len) {
  var value = propertiesStorage.getProperty(name);
  if (typeof value !== 'string') {
    propertiesStorage.setProperty(name, name);
  } else if (value.length > len) {
    propertiesStorage.setProperty(name, value.substring(0, len));
  }
}

limitValueLen('Custom1', 16);
limitValueLen('Custom2', 16);

function checkHistory(data) {
  if (
    typeof data.url === 'string' &&
    typeof data.method === 'string' &&
    typeof data.headers === 'string'
  ) {
    if (!data.body) {
      data.body = '';
      return true;
    }
    return typeof data.body === 'string';
  }
}

function getShadowRules(shadowRules, rulesText) {
  if (rulesText) {
    shadowRules = shadowRules ? rulesText + '\n' + shadowRules : rulesText;
  }
  return shadowRules;
}

/**
 * rules
 */

function reverseRules(text, orig) {
  if (!text) {
    return '';
  }
  text = util.resolveInlineValues(text, inlineValues);
  text = text.split(LINE_END_RE).reverse();
  return orig ? text : text.join('\n');
}

httpMgr.addChangeListener(function() {
  var disableRules =
    !config.notAllowedDisableRules &&
    propertiesStorage.getProperty('disabledAllRules');
  var shadowRules =
    disableRules && config.allowDisableShadowRules ? null : config.shadowRules;
  var value = [];
  shadowRules = getShadowRules(shadowRules, serviceRules);
  shadowRules = getShadowRules(shadowRules, mockRules);
  if (!disableRules && !config.multiEnv) {
    getAllRulesFile().forEach(function (file) {
      if (file.selected && !util.isGroup(file.name)) {
        value.push(file.data);
      }
    });
  }
  var backRulesFirst =
    !config.disabledBackOption &&
    propertiesStorage.getProperty('backRulesFirst') === true;
  var defaultRules =
    disableRules || defaultRulesIsDisabled() ? null : getDefaultRules();
  if (defaultRules) {
    if (backRulesFirst) {
      value.unshift(defaultRules);
    } else {
      value.push(defaultRules);
    }
  }

  if (backRulesFirst) {
    value = reverseRules(value.join('\n'), true);
  }
  value = value && value.join('\r\n');
  if (shadowRules) {
    if (backRulesFirst) {
      value = reverseRules(shadowRules) + '\n' + value;
    } else {
      value += '\n' + shadowRules;
    }
  }
  var rulesText = value;
  if (rulesText) {
    var index = 0;
    rulesText = rulesText.replace(REMOTE_RULES_RE, function (_, apo, rulesUrl) {
      if (index >= MAX_REMOTE_RULES_COUNT) {
        return '';
      }
      ++index;
      var remoteRules = util.getRemoteRules(apo, rulesUrl);
      return backRulesFirst ? reverseRules(remoteRules) : remoteRules;
    });
  }
  rules._rawRulesText = rulesText;
  pluginMgr.emit('updateRules', true);
  rules.parse(rulesText, null, inlineValues);
  inlineValues = {};
});

function parseRules() {
  return httpMgr.triggerChange();
}

exports.parseRules = parseRules;

function setDefaultRules(data) {
  data = typeof data != 'string' ? '' : data;
  var oldData = rulesStorage.getProperty('defalutRules') || '';
  rulesStorage.setProperty('defalutRules', data);
  parseRules();
  return data !== oldData;
}

function getDefaultRules() {
  return rulesStorage.getProperty('defalutRules');
}

function disableDefaultRules() {
  rulesStorage.setProperty('disabledDefalutRules', true);
  parseRules();
  proxy.emit('rulesDataChange', 'disabledDefalutRules', true);
}

function enableDefaultRules() {
  rulesStorage.setProperty('disabledDefalutRules', false);
  parseRules();
  proxy.emit('rulesDataChange', 'disabledDefalutRules', false);
}

function defaultRulesIsDisabled() {
  return rulesStorage.getProperty('disabledDefalutRules');
}

function selectRulesFile(file) {
  if (!rulesStorage.existsFile(file) || config.multiEnv) {
    return;
  }
  var isGroup = util.isGroup(file);
  var selectedList = isGroup || allowMultipleChoice() ? getSelectedRulesList() : [];
  if (!isGroup && selectedList.indexOf(file) == -1) {
    selectedList.push(file);
    rulesStorage.setProperty('selectedList', selectedList);
  }
  parseRules();
  proxy.emit('rulesDataChange', 'selectedList', selectedList);
  return selectedList;
}

function unselectRulesFile(file, force, all) {
  if (!force && config.multiEnv) {
    return;
  }
  var selectedList = getSelectedRulesList();
  var hasChanged;
  all = all || [file];
  all.forEach(function(name) {
    var index = selectedList.indexOf(name);
    if (index != -1) {
      selectedList.splice(index, 1);
      hasChanged = true;
    }
  });
  if (hasChanged) {
    rulesStorage.setProperty('selectedList', selectedList);
    parseRules();
    proxy.emit('rulesDataChange', 'selectedList', selectedList);
  }
  return selectedList;
}

function allowMultipleChoice() {
  return (
    !config.disabledMultipleOption &&
    propertiesStorage.getProperty('allowMultipleChoice')
  );
}

function clearSelection() {
  rulesStorage.setProperty('selectedList', []);
  proxy.emit('rulesDataChange', 'selectedList', []);
  parseRules();
}

function getSelectedRulesList() {
  if (config.multiEnv) {
    return [];
  }
  var selectedList = rulesStorage.getProperty('selectedList');
  if (!Array.isArray(selectedList)) {
    selectedList = [];
    rulesStorage.setProperty('selectedList', selectedList);
  }
  return selectedList;
}

function removeRulesFile(file, all) {
  if (all) {
    if (rulesStorage.removeGroup(file)) {
      unselectRulesFile(file, true, all);
      return true;
    }
    return false;
  }
  unselectRulesFile(file, true);
  return rulesStorage.removeFile(file);
}

function renameRulesFile(file, newFile) {
  if (!rulesStorage.renameFile(file, newFile)) {
    return;
  }

  var selectedList = getSelectedRulesList();
  var index = selectedList.indexOf(file);
  if (index != -1) {
    selectedList[index] = newFile;
    rulesStorage.setProperty('selectedList', selectedList);
  }
  return true;
}

function addRulesFile(file, data) {
  return rulesStorage.writeFile(file, data);
}

function getAllRulesFile() {
  var list = rulesStorage.getFileList();
  var selectedList = getSelectedRulesList();
  list.forEach(function (file) {
    file.selected = !util.isGroup(file.name) && selectedList.indexOf(file.name) != -1;
  });
  return list;
}

function getFirstGroup(storage) {
  var list = storage.getFileList();
  for (var i = 0, len = list.length; i < len; i++) {
    if (util.isGroup(list[i].name)) {
      return list[i];
    }
  }
}

function resetRulesIfResort(fromName, toName) {
  var selectedList = getSelectedRulesList();
  if (
    selectedList.indexOf(fromName) == -1 &&
    selectedList.indexOf(toName) == -1
  ) {
    return;
  }
  parseRules();
}

function moveRulesTo(fromName, toName, clientId, group, toTop) {
  if (rulesStorage.moveTo(fromName, toName, group, toTop)) {
    resetRulesIfResort(fromName, toName);
    config.setModified(clientId, true);
    proxy.emit('rulesDataChange', 'move', fromName, toName);
    return true;
  }
}

exports.rules = {
  getConfig: function() {
    var list = [
      {
        name: 'Default',
        selected: !defaultRulesIsDisabled()
      }
    ];
    var selectedList = getSelectedRulesList();
    rulesStorage.getFileList().forEach(function (file) {
      if (!util.isGroup(file.name)) {
        list.push({ name: file.name, selected: selectedList.indexOf(file.name) !== -1 });
      }
    });
    return {
      pluginsDisabled: propertiesStorage.getProperty('disabledAllPlugins'),
      disabled: !config.notAllowedDisableRules && propertiesStorage.getProperty('disabledAllRules'),
      list: list
    };
  },
  disableAllRules: function(disabled) {
    propertiesStorage.setProperty('disabledAllRules', disabled);
    parseRules();
    proxy.emit('rulesDataChange', 'disabledAllRules', disabled);
  },
  getRawRulesText: function() {
    return rules._rawRulesText || '';
  },
  moveGroupToTop: function(groupName, clientId) {
    var result = rulesStorage.moveGroupToTop(groupName);
    if (result) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'moveGroupToTop');
    }
    return result;
  },
  exists: function(name) {
    return rulesStorage.existsFile(name);
  },
  recycleBin: rulesStorage.recycleBin,
  enableBackRulesFirst: function (backRulesFirst) {
    var curFlag = propertiesStorage.getProperty('backRulesFirst') === true;
    if (curFlag !== backRulesFirst) {
      propertiesStorage.setProperty('backRulesFirst', backRulesFirst);
      parseRules();
      proxy.emit('rulesDataChange', 'backRulesFirst', backRulesFirst);
    }
  },
  getAllData: function() {
    var list = getAllRulesFile();
    list.unshift({
      name: 'Default',
      data: getDefaultRules(),
      selected: !defaultRulesIsDisabled()
    });
    return {
      backRulesFirst: propertiesStorage.getProperty('backRulesFirst') === true,
      allowMultipleChoice: !!propertiesStorage.getProperty('allowMultipleChoice'),
      list: list
    };
  },
  moveTo: moveRulesTo,
  moveToTop: function (name, clientId) {
    var first = name && getAllRulesFile()[0];
    first && moveRulesTo(name, first.name, clientId, null, true);
  },
  moveToGroup: function(name, groupName, isTop) {
    if (rulesStorage.moveToGroup(name, groupName, isTop)) {
      proxy.emit('rulesDataChange', 'moveToGroup', name, groupName, isTop);
    }
  },
  get: function (file) {
    return rulesStorage.readFile(file);
  },
  remove: function (file, clientId, all) {
    if (removeRulesFile(file, all)) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'remove', file);
    }
  },
  getFirstGroup: function() {
    return getFirstGroup(rulesStorage);
  },
  add: function (file, data, clientId) {
    if (file === 'Default') {
      return;
    }
    var result = addRulesFile(file, data);
    if (result) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'add', file);
    }
    return result;
  },
  rename: function (file, newFile, clientId) {
    if (renameRulesFile(file, newFile)) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'rename', file, newFile);
    }
  },
  select: selectRulesFile,
  unselect: unselectRulesFile,
  list: getAllRulesFile,
  getDefault: getDefaultRules,
  setDefault: function (value, clientId) {
    if (setDefaultRules(value)) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'add', 'Default');
    }
  },
  enableDefault: enableDefaultRules,
  disableDefault: disableDefaultRules,
  defaultRulesIsDisabled: defaultRulesIsDisabled,
  parseRules: parseRules,
  clearSelection: clearSelection,
  getSelectedList: getSelectedRulesList
};

/**
 * values
 */

function addValuesFile(file, data) {
  return valuesStorage.writeFile(file, data);
}

exports.removeBatch = function(obj, body) {
  var list = body.list;
  var name = body.name;
  if (!Array.isArray(list) || !list.length) {
    list = [name];
  }
  list.forEach(function(item) {
    obj.remove(item, body.clientId);
  });
};

exports.values = {
  recycleBin: valuesStorage.recycleBin,
  exists: function(name) {
    return valuesStorage.existsFile(name);
  },
  LIMIMT_FILES_COUNT: MAX_FILENAME_LEN,
  moveTo: function (fromName, toName, clientId, group, toTop) {
    if (valuesStorage.moveTo(fromName, toName, group, toTop)) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'move', fromName, toName);
      return true;
    }
  },
  moveToGroup: function(name, groupName, isTop) {
    if (valuesStorage.moveToGroup(name, groupName, isTop)) {
      proxy.emit('valuesDataChange', 'moveToGroup', name, groupName, isTop);
    }
  },
  getFirstGroup: function() {
    return getFirstGroup(valuesStorage);
  },
  add: function (file, data, clientId) {
    var result = addValuesFile(file, data);
    if (result) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'add', file);
    }
    return result;
  },
  get: function (file) {
    return valuesStorage.readFile(file);
  },
  remove: function remove(file, clientId, all) {
    if (all ? valuesStorage.removeGroup(file) : valuesStorage.removeFile(file)) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'remove', file);
    }
  },
  rename: function (file, newFile, clientId) {
    if (valuesStorage.renameFile(file, newFile)) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'rename', file, newFile);
    }
  },
  list: function list() {
    return valuesStorage.getFileList();
  }
};

setTimeout(function getWhistleVersion() {
  util.getLatestVersion('https://registry.npmjs.org/whistle', function (ver) {
    ver && propertiesStorage.writeFile('latestVersion', ver);
    setTimeout(getWhistleVersion, INTERVAL);
  });
}, 1000); //等待package的信息配置更新完成

function setEnableCapture(enable) {
  config.isEnableCapture = enable;
  propertiesStorage.setProperty('interceptHttpsConnects', enable);
}

if (config.persistentCapture && config.isEnableCapture) {
  setEnableCapture(true);
}

/**
 * properties
 */
var composerTimer;
function saveComposerHistory() {
  composerTimer = null;
  try {
    propertiesStorage.writeFile('composerHistory', JSON.stringify(history));
  } catch (e) {}
}

exports.properties = {
  setIPv6Only: function(checked) {
    checked = !!checked;
    propertiesStorage.setProperty('ipv6Only', checked);
    config.ipv6Only = checked;
  },
  setDnsOrder: function(order) {
    if (config.setDefaultResultOrder(order)) {
      order = +order;
      config.dnsOrder = order;
      propertiesStorage.setProperty('dnsOrder', order);
    }
  },
  getLatestVersion: function () {
    var version = propertiesStorage.readFile('latestVersion');
    return typeof version === 'string' && version.length < 60 ? version : '';
  },
  isEnableCapture: function () {
    if (config.multiEnv || config.notAllowedEnableHTTPS) {
      return false;
    }
    if (config.isEnableCapture != null) {
      return config.isEnableCapture;
    }
    return !!propertiesStorage.getProperty('interceptHttpsConnects');
  },
  setEnableCapture: setEnableCapture,
  isEnableHttp2: function () {
    if (config.isEnableHttp2 != null) {
      return config.isEnableHttp2;
    }
    return propertiesStorage.getProperty('enableHttp2') !== false;
  },
  setEnableHttp2: function (enable) {
    config.isEnableHttp2 = enable;
    propertiesStorage.setProperty('enableHttp2', enable);
  },
  set: function (name, value) {
    typeof name == 'string'
      ? propertiesStorage.setProperty(name, value)
      : propertiesStorage.setProperties(name);
  },
  remove: function (name) {
    propertiesStorage.removeProperty(name);
  },
  get: function (name) {
    return propertiesStorage.getProperty(name);
  },
  getHistory: function () {
    return history;
  },
  addHistory: function (data) {
    if (!data.needResponse || !checkHistory(data)) {
      return;
    }
    var url = data.url;
    var method = data.method;
    var headers = data.headers;
    var body = data.body;
    var base64 = data.base64;
    if (body || !base64 || typeof base64 !== 'string' || base64.length > MAX_BASE64_LEN) {
      base64 = undefined;
    }
    var result = {
      date: Date.now(),
      useH2: data.useH2,
      url: url.length > MAX_URL_LEN ? url.substring(0, MAX_URL_LEN) : url,
      method:
        method.length > MAX_METHOD_LEN
          ? method.substring(0, MAX_METHOD_LEN)
          : method,
      headers:
        headers.length > MAX_HEADERS_LEN
          ? headers.substring(0, MAX_HEADERS_LEN)
          : headers,
      body: body.length > MAX_BODY_LEN ? body.substring(0, MAX_BODY_LEN) : body,
      isHexText: !!data.isHexText,
      base64: base64,
      enableProxyRules: !!data.enableProxyRules
    };
    for (var i = 0, len = history.length; i < len; i++) {
      var item = history[i];
      if (
        item.url === result.url &&
        item.method === result.method &&
        item.headers === result.headers &&
        item.body === result.body &&
        item.base64 === result.base64 &&
        !item.useH2 !== result.useH2 &&
        !item.enableProxyRules !== result.enableProxyRules
      ) {
        history.splice(i, 1);
        break;
      }
    }
    history.unshift(result);
    var overflow = history.length - MAX_HISTORY_LEN;
    if (overflow > 0) {
      history.splice(MAX_HISTORY_LEN, overflow);
    }
    if (!composerTimer) {
      composerTimer = setTimeout(saveComposerHistory, 2000);
    }
    proxy.emit('composerDataChange', history);
  }
};

function getRules(rules) {
  if (Array.isArray(rules)) {
    return rules.join('\n');
  }
  if (typeof rules === 'string') {
    return rules;
  }
}

exports.addRules = function (rules, replace, clientId) {
  if (rules == null) {
    return;
  }
  replace = replace !== false;
  var hasChanged;
  if (Array.isArray(rules) || typeof rules == 'string') {
    if (replace !== false || !getDefaultRules()) {
      hasChanged = setDefaultRules(getRules(rules));
    }
  } else {
    var keys = Object.keys(rules).slice(keys, MAX_COUNT_BY_IMPORT);
    keys.forEach(function (name) {
      var item = name ? rules[name] : null;
      if (Array.isArray(item) || typeof item === 'string') {
        item = { rules: item };
      }
      if (item) {
        item.rules = getRules(item.rules);
        if (typeof item.replace !== 'boolean') {
          item.replace = replace;
        }
        if (name === 'Default') {
          if (
            typeof item.rules === 'string' &&
            (item.replace !== false || !getDefaultRules())
          ) {
            if (setDefaultRules(item.rules)) {
              hasChanged = true;
            }
          }
          if (item.enable) {
            enableDefaultRules();
          } else if (item.enable === false) {
            disableDefaultRules();
          }
        } else {
          if (
            typeof item.rules === 'string' &&
            (item.replace !== false || !rulesStorage.existsFile(name))
          ) {
            if (addRulesFile(name, item.rules)) {
              hasChanged = true;
            }
          }
          if (item.enable) {
            selectRulesFile(name);
          } else if (item.enable === false) {
            unselectRulesFile(name);
          }
        }
      }
    });
  }
  if (hasChanged) {
    config.setModified(clientId, true);
    proxy.emit('rulesDataChange', 'addRules');
  }
};

exports.addValues = function (values, replace, clientId) {
  if (values == null || Array.isArray(values)) {
    return;
  }
  replace = replace !== false;
  var hasChanged;
  var keys = Object.keys(values).slice(0, MAX_COUNT_BY_IMPORT);
  keys.forEach(function (name) {
    var isGroup = name[0] === '\r';
    name = name.trim();
    if (!name || /\s/.test(name)) {
      return;
    }
    if (isGroup) {
      name = '\r' + name;
    }
    if (!replace && valuesStorage.existsFile(name)) {
      return;
    }
    var value = name ? values[name] : null;
    if (value == null) {
      return;
    }
    if (typeof value !== 'string') {
      value = JSON.stringify(value, null, '  ');
    }
    if (addValuesFile(name, value)) {
      hasChanged = true;
    }
  });
  if (hasChanged) {
    config.setModified(clientId);
    proxy.emit('valuesDataChange', 'addValues');
  }
};

exports.setup = function (p) {
  proxy = p;
};

exports.setServiceRules = function(rulesText) {
  if (typeof rulesText === 'string') {
    serviceRules = rulesText;
    parseRules();
  }
};

exports.getServiceRules = function() {
  return serviceRules;
};

exports.setMockRules = function(rulesText) {
  if (typeof rulesText === 'string') {
    mockRules = rulesText;
    parseRules();
  }
};

exports.getMockRules = function() {
  return mockRules;
};

exports.setPluginMgr = function(p) {
  pluginMgr = p;
};
