var rules = require('./index');
var util = require('../util');
var config = require('../config');
var Storage = require('./storage');
var httpMgr = require('../util/http-mgr');

var INTERVAL = 1000 * 60 * 60 * 2;
var rulesStorage = new Storage(
  config.rulesDir,
  { Default: true },
  config.disableWebUI
);
var valuesStorage = new Storage(config.valuesDir, null, config.disableWebUI);
var propertiesStorage = new Storage(config.propertiesDir, { composerHistory: true }, config.disableWebUI);
var LINE_END_RE = /\n|\r\n|\r/g;
var SPACE_RE = /\s/;
var MAX_COUNT_BY_IMPORT = 100;
var inlineValues = {};
var proxy, pluginMgr;
var serviceRules;
var mockRules;
var dnsOrder = propertiesStorage.getProperty('dnsOrder');

config.ipv6Only = config.ipv6Only || !!propertiesStorage.getProperty('ipv6Only');
if (!config.dnsOrder && !config.setDefaultResultOrder(dnsOrder)) {
  config.dnsOrder = config.defaultDnsOrder;
}

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

/**
 * rules
 */

function resolveInlineValues(text) {
  return util.resolveInlineValues(text, inlineValues);
}

function reverseRules(text) {
  if (!text) {
    return '';
  }
  text = resolveInlineValues(text);
  text = text.split(LINE_END_RE).reverse();
  return text.join('\n');
}

httpMgr.addChangeListener(function() {
  var disableRules =
    !config.notAllowedDisableRules &&
    propertiesStorage.getProperty('disabledAllRules');
  var shadowRules =
    disableRules && config.allowDisableShadowRules ? null : config.shadowRules;
  var backRulesFirst =
    !config.disabledBackOption &&
    propertiesStorage.getProperty('backRulesFirst') === true;
  var defaultRules = disableRules || defaultRulesIsDisabled() ? null : getDefaultRules();
  var rulesList = [];
  var resolveRemoteRules = util.getRemoteRulesResolver(inlineValues);
  var addRules = function(text, name, type) {
    if (text) {
      var file = (type || 'File: ') + name;
      if (backRulesFirst && !type) {
        text = resolveRemoteRules(reverseRules(text));
        rulesList.unshift({
          file: file,
          text: text
        });
      } else {
        text = resolveRemoteRules(resolveInlineValues(text));
        rulesList.push({
          file: file,
          text: text
        });
      }

    }
  };
  if (!disableRules && !config.multiEnv) {
    getAllRulesFile().forEach(function (file) {
      if (file.selected && !util.isGroup(file.name)) {
        addRules(file.data, file.name);
      }
    });
  }
  addRules(defaultRules, 'Default');
  addRules(mockRules, '', 'Mock Rules');
  addRules(serviceRules, '', 'Service Rules');
  addRules(shadowRules, '', 'Shadow Rules');
  rules._rawRulesText = rulesList.map(function(item) {
    return item.text;
  }).join('\r\n');
  pluginMgr.emit('updateRules', true);
  rules.parse(rulesList, null, inlineValues);
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
  getEnabledRules: function() {
    return rules.getEnabledRules();
  },
  getMFlag: function() {
    return rules.getMFlag();
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
  if (config.checkUpdateClient) {
    util.getLatestVersion('https://raw.githubusercontent.com/avwo/whistle-client/main/package.json', function (ver) {
      ver && propertiesStorage.writeFile('latestClientVersion', ver);
    }, 'version' );
  }
}, 1000); //等待package的信息配置更新完成

function setEnableCapture(enable) {
  config.isEnableCapture = enable;
  propertiesStorage.setProperty('interceptHttpsConnects', enable);
}

if (config.persistentCapture && config.isEnableCapture) {
  setEnableCapture(true);
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
  getLatestVersion: function (name) {
    var version = propertiesStorage.readFile(name || 'latestVersion');
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

function getKeys(obj) {
  var list = obj[''];
  var keys = Object.keys(obj);
  list = list && (Array.isArray(list) ? list : Array.isArray(list.list) ? list.list : null);
  if (!list) {
    return keys;
  }
  delete obj[''];
  var result = [];
  var count = 0;
  list = list.concat(keys);
  for (var i = 0, len = list.length; i < len; i++) {
    var name = list[i];
    if (util.isString(name) && (result.indexOf(name) === -1)) {
      if (++count > MAX_COUNT_BY_IMPORT) {
        return result;
      }
      result.push(name);
    }
  }
  return result;
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
    getKeys(rules).forEach(function (name) {
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
  getKeys(values).forEach(function (name) {
    var isGroup = name[0] === '\r';
    name = name.trim();
    if (!name || SPACE_RE.test(name)) {
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
      value = JSON.stringify(value, null, '  ') || '';
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
